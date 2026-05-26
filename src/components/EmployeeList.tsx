import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  Avatar,
  Modal,
  Tabs,
  Popconfirm,
  Button,
  message,
  Select,
  Space,
  InputNumber,
  Spin,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  MailFilled,
  PhoneFilled,
  ThunderboltOutlined,
  DesktopOutlined,
  BgColorsOutlined,
  SafetyCertificateFilled,
  HistoryOutlined,
  SwapOutlined,
  CloseOutlined,
  UserAddOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { employeeService } from "../services/employeeService";
import {
  assignmentService,
  type TransferAssetsDto,
  type TransferConsumableDto,
} from "../services/assignmentService";
import "../CSS/GlobalStyle.css";
import axiosClient from "../axiosClient";
import { User2Icon, UserCircle } from "lucide-react";
import { debounce } from "lodash";
import { locationService, type Location } from "../services/useLocationService";
import { generateQrPdf } from "../utils/generateQrPdf"; // chỉnh đường dẫn theo project
import { makeQrDetailUrl } from "../utils/qrUtils";
const { Title, Text } = Typography;

interface AllocationData {
  hardwareAssets: any[];
  softwareLicenses: any[];
  consumables: any[];
}

const EmployeeList: React.FC = () => {
  // --- STATES ---
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [allocationData, setAllocationData] = useState<AllocationData | null>(
    null,
  );
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("1");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [hwSearch, setHwSearch] = useState("");
  const [swSearch, setSwSearch] = useState("");

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [selectedConsumables, setSelectedConsumables] = useState<any[]>([]);
  const [transferQuantities, setTransferQuantities] = useState<
    Record<number, number>
  >({});

  const [locations, setLocations] = useState<Location[]>([]);
  const [targetLocation, setTargetLocation] = useState<string | null>(null);

  const [innerPageSize, setInnerPageSize] = useState(5);
  const handleDownloadQR = async () => {
    const selectedAssets = allocationData?.hardwareAssets.filter((asset) =>
      selectedRowKeys.includes(asset.assetId),
    );
    if (!selectedAssets || selectedAssets.length === 0) return;

    const employee = {
      userId: selectedEmployee?.employeeId || null,
      name: selectedEmployee?.fullName || null,
      department: selectedEmployee?.department || null,
    };

    console.log("Employee for QR:", employee);
    console.log("Selected assets count:", selectedAssets.length);

    // Tạo assets với qrValue đã được tạo sẵn (có employee info)
    const assetsWithQr = await Promise.all(
      selectedAssets.map(async (a) => {
        // Tạo QR content với employee
        const qrContent = makeQrDetailUrl(
          {
            id: a.assetId,
            assetTag: a.assetTag,
            serial: a.serial,
            specs: a.specs || "",
          },
          employee,
        );

        console.log(`QR Content for ${a.serial}:`, qrContent);

        return {
          id: a.assetId,
          assetTag: a.assetTag,
          serial: a.serial,
          modelName: a.modelName,
          specs: a.specs || "",
          qrValue: qrContent, // Đã có employee info
        };
      }),
    );

    await generateQrPdf(
      assetsWithQr,
      `QR_${selectedEmployee?.employeeId}_${dayjs().format("DDMMYYYY")}.pdf`,
      {
        recipientName: selectedEmployee?.fullName,
        department: selectedEmployee?.department,
        code: selectedEmployee?.employeeId,
      },
    );

    message.success(`Đang tải xuống ${assetsWithQr.length} mã QR`);
  };
  useEffect(() => {
    if (transferModalOpen) {
      locationService.getAll().then((res) => setLocations(res.data));
      setTargetLocation(null); // Reset khi mở mới
    }
  }, [transferModalOpen]);
  // Hàm xử lý thay đổi số lượng trên Input
  const handleQuantityChange = (
    transactionId: number,
    value: number,
    max: number,
  ) => {
    // Đảm bảo không nhập quá số lượng đang có hoặc nhỏ hơn 1
    const val = Math.max(1, Math.min(max, value));
    setTransferQuantities((prev) => ({ ...prev, [transactionId]: val }));
  };
  // --- FETCH DATA ---
  const fetchApiData = useCallback(
    async (page: number, search: string, size: number) => {
      setLoading(true);
      try {
        const response: any = await employeeService.getAll({
          search,
          pageNumber: page,
          pageSize: size, // Sử dụng biến size truyền từ tham số
        });

        setData(response.data?.items || []);

        // CẬP NHẬT CẢ 3 GIÁ TRỊ: trang hiện tại, tổng số, và kích thước trang
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: size, // Lưu lại size mới vào state để Table render đúng
          total: response.data?.totalCount || 0,
        }));
      } catch (err) {
        message.error("Không thể tải danh sách nhân viên");
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  ); // Để mảng rỗng để tránh hàm bị khởi tạo lại không cần thiết

  useEffect(() => {
    fetchApiData(1, "", pagination.pageSize);
  }, []);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchApiData(1, searchText, pagination.pageSize);
  };

  const fetchAllocations = async (employeeId: string) => {
    setAllocationLoading(true);

    try {
      const response: any = await employeeService.getAllocations(employeeId);
      setAllocationData(response.data);
    } catch (err) {
      message.error("Lỗi lấy dữ liệu cấp phát");
    } finally {
      setAllocationLoading(false);
    }
  };

  const [transferEmpList, setTransferEmpList] = useState<any[]>([]);
  const [transferEmpPage, setTransferEmpPage] = useState(1);
  const [transferEmpLoading, setTransferEmpLoading] = useState(false);
  const [transferEmpHasMore, setTransferEmpHasMore] = useState(true);
  const [transferEmpSearch, setTransferEmpSearch] = useState("");

  // Hàm load dữ liệu (Paged)
  const loadTransferEmployees = async (
    search: string,
    pageNum: number,
    isAppend: boolean,
  ) => {
    if (transferEmpLoading) return;
    setTransferEmpLoading(true);
    try {
      const res = await employeeService.getLookupPaged(search, pageNum);
      const data = res.data || res; // Tùy cấu trúc API trả về

      // Lọc bỏ nhân viên hiện tại (người đang bàn giao) khỏi danh sách đích
      const filteredData = data.filter(
        (e: any) => e.employeeId !== selectedEmployee?.employeeId,
      );

      if (isAppend) {
        setTransferEmpList((prev) => [...prev, ...filteredData]);
      } else {
        setTransferEmpList(filteredData);
      }

      setTransferEmpHasMore(data.length === 20); // Giả định pageSize = 20
      setTransferEmpPage(pageNum);
    } catch (err) {
      console.error("Lỗi tải danh sách bàn giao", err);
    } finally {
      setTransferEmpLoading(false);
    }
  };

  // Debounce search để tránh spam API
  const debouncedTransferSearch = useCallback(
    debounce((val: string) => {
      loadTransferEmployees(val, 1, false);
    }, 500),
    [selectedEmployee],
  );

  // Trigger load lần đầu khi mở Modal
  useEffect(() => {
    if (transferModalOpen) {
      setTransferEmpSearch("");
      loadTransferEmployees("", 1, false);
    }
  }, [transferModalOpen]);
  // --- HANDLERS ---
  const handleRowClick = (record: any) => {
    setSelectedEmployee(record);
    setSelectedRowKeys([]); // Reset checkbox khi mở nhân viên mới
    setAllocationModalOpen(true);
    fetchAllocations(record.employeeId);
  };

  const handleBulkRevoke = async (type: "HW" | "SW") => {
    try {
      setAllocationLoading(true);

      // Chuẩn bị Payload cho API mới
      const payload = {
        assetIds: type === "HW" ? selectedRowKeys.map((id) => Number(id)) : [],
        licenseIds:
          type === "SW" ? selectedRowKeys.map((id) => Number(id)) : [],
        employeeId: selectedEmployee.employeeId,
        note: "Thu hồi hàng loạt từ danh sách nhân viên",
      };

      await assignmentService.revokeBulk(payload);

      message.success(`Đã thu hồi thành công các mục được chọn`);
      setSelectedRowKeys([]); // Reset checkbox
      fetchAllocations(selectedEmployee.employeeId); // Reload dữ liệu tại chỗ
    } catch (err: any) {
      message.error(err.response?.data || "Lỗi khi thu hồi hàng loạt");
    } finally {
      setAllocationLoading(false);
    }
  };
  const downloadHandoverFile = async (handoverId: number) => {
    try {
      const response = await axiosClient.get(`/Handover/export/${handoverId}`, {
        responseType: "blob",
      });

      // 1. Trích xuất tên file từ header Content-Disposition
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `BienBanBanGiao_${handoverId}.docx`; // Tên mặc định dự phòng

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      // 2. Tạo Blob và tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Sử dụng tên file mà Backend gửi về
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      // 3. Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error("Lỗi khi tải file từ hệ thống.");
    }
  };
  const handleBulkTransfer = async () => {
    if (!targetEmployeeId)
      return message.warning("Vui lòng chọn nhân viên nhận");
    if (!targetLocation) {
      message.warning("Vui lòng chọn Vị trí bàn giao!");
      return;
    }
    setTransferLoading(true);

    try {
      let res: any; // Khai báo biến res để hứng kết quả trả về

      if (activeTab === "3") {
        // Logic bàn giao vật tư (Tab 3)
        const payload: TransferConsumableDto = {
          fromEmployeeId: selectedEmployee.employeeId,
          toEmployeeId: targetEmployeeId,

          items: selectedConsumables.map((item) => ({
            consumableId: item.consumableId,
            quantity: transferQuantities[item.transactionId] || item.quantity,
          })),
        };
        // Gán kết quả trả về cho res
        res = await assignmentService.transferConsumables(payload);
      } else {
        // Logic bàn giao HW/SW (Tab 1 & 2)
        const selectedIds = selectedRowKeys.map((key) => Number(key));
        const payload: TransferAssetsDto = {
          assetIds: activeTab === "1" ? selectedIds : [],
          licenseIds: activeTab === "2" ? selectedIds : [],
          fromEmployeeId: selectedEmployee.employeeId,
          toEmployeeId: targetEmployeeId,
          condition: "Bàn giao hàng loạt từ quản lý nhân sự",
          location: targetLocation,
        };
        // Gán kết quả trả về cho res
        res = await assignmentService.transferAssets(payload);
      }

      message.success("Bàn giao thành công");

      // Backend trả về:
      // > 0 nếu có tạo biên bản (Hardware Asset)
      // = 0 nếu thành công nhưng không tạo biên bản (Chỉ có License)
      const handoverId = res?.handoverId;

      // Kiểm tra điều kiện bàn giao Hardware (handoverId > 0)
      if (typeof handoverId === "number" && handoverId > 0) {
        const hide = message.loading(
          "Đang khởi tạo biên bản bàn giao thiết bị...",
          2.5,
        );
        try {
          await downloadHandoverFile(handoverId);
        } catch (downloadErr) {
          console.error("Download failed:", downloadErr);
          message.warning(
            "Bàn giao xong nhưng không thể tải file, vui lòng tải lại trong danh sách biên bản.",
          );
        } finally {
          hide();
        }
      }
      // Nếu handoverId === 0, code sẽ tự bỏ qua và không gọi lệnh download
      // Reset States
      setTransferModalOpen(false);
      setSelectedRowKeys([]);
      setSelectedConsumables([]);
      setTargetEmployeeId(null);
      setTransferQuantities({});
      setTargetLocation(null);
      // Reload lại dữ liệu bảng
      fetchAllocations(selectedEmployee.employeeId);
    } catch (err: any) {
      message.error(err.response?.data || "Lỗi khi bàn giao");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleBulkRevokeConsumable = async () => {
    if (selectedRowKeys.length === 0) return;

    try {
      setAllocationLoading(true);
      // Ép kiểu sang number vì transactionId là số
      const ids = selectedRowKeys.map((id) => Number(id));

      await assignmentService.revokeConsumableBulk(ids);

      message.success(`Đã hoàn tác ${ids.length} vật tư thành công`);
      setSelectedRowKeys([]);
      setSelectedConsumables([]);
      fetchAllocations(selectedEmployee.employeeId);
    } catch (err: any) {
      message.error(err.response?.data || "Lỗi khi hoàn tác hàng loạt");
    } finally {
      setAllocationLoading(false);
    }
  };
  const handleRevokeAssignment = async (record: any, type: "HW" | "SW") => {
    try {
      await employeeService.revokeAssignment({
        employeeId: selectedEmployee.employeeId,
        assetId: type === "HW" ? record.assetId : undefined,
        licenseId: type === "SW" ? record.licenseId : undefined,
        note: `Thu hồi lẻ từ hệ thống`,
      });
      message.success("Thu hồi thành công");
      fetchAllocations(selectedEmployee.employeeId);
    } catch (err: any) {
      message.error(err.response?.data || "Lỗi thu hồi");
    }
  };

  const handleRevokeConsumable = async (transactionId: number) => {
    try {
      await employeeService.revokeConsumable(transactionId);
      message.success("Hoàn tác thành công");
      fetchAllocations(selectedEmployee.employeeId);
    } catch (err: any) {
      message.error("Lỗi khi hoàn tác");
    }
  };

  // --- RENDER HELPERS ---
  const filteredHardware = allocationData?.hardwareAssets.filter(
    (item) =>
      item.assetTag?.toLowerCase().includes(hwSearch.toLowerCase()) ||
      item.modelName?.toLowerCase().includes(hwSearch.toLowerCase()) ||
      item.serial?.toLowerCase().includes(hwSearch.toLowerCase()),
  );

  const filteredSoftware = allocationData?.softwareLicenses.filter(
    (item) =>
      item.softwareName?.toLowerCase().includes(swSearch.toLowerCase()) ||
      item.username?.toLowerCase().includes(swSearch.toLowerCase()),
  );

  const columns = [
    {
      title: "NHÂN VIÊN",
      key: "info",
      render: (record: any) => (
        <div className="asset-info-cell-3d">
          <div className="icon-box-3d">
            <Avatar src={record.avatar} icon={<UserOutlined />} />
          </div>
          <div className="text-group">
            <Text strong className="name-3d">
              {record.fullName}
            </Text>
            <div className="sub-path">
              {record.employeeId} • {record.position || "Staff"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "PHÒNG BAN",
      dataIndex: "department",
      key: "department",
      render: (text: string) => (
        <div className="type-pill-3d" style={{ "--accent": "#10b981" } as any}>
          <span className="dot"></span>
          <Text strong>{text || "N/A"}</Text>
        </div>
      ),
    },
    {
      title: "LIÊN HỆ",
      key: "contact",
      render: (record: any) => (
        <div className="contact-info-stack">
          <div style={{ fontSize: "12px" }}>
            <MailFilled style={{ color: "#3b82f6" }} /> {record.email || "---"}
          </div>
          <div style={{ fontSize: "12px" }}>
            <PhoneFilled style={{ color: "#10b981" }} /> {record.phone || "---"}
          </div>
        </div>
      ),
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "center" as const,
      render: (record: any) => (
        <Button
          type="primary"
          className="btn-view-assets-3d"
          icon={<DesktopOutlined />}
          onClick={() => handleRowClick(record)}
        >
          Xem thiết bị
        </Button>
      ),
    },
  ];

  return (
    <div className="glass-page-container">
      <div className="page-fade-in">
        {/* BENTO HEADER */}
        <div className="bento-header-wrapper">
          <div className="bento-card welcome-banner" style={{ flex: 2 }}>
            <div className="banner-content">
              <div className="banner-badge">
                <ThunderboltOutlined /> RESOURCE MGMT
              </div>
              <Title level={1} className="banner-title">
                Employee Directory
              </Title>
              <Text className="banner-subtitle">
                Quản lý nhân sự và tài sản cấp phát Vinatech Vina
              </Text>
            </div>
          </div>
          <div className="bento-card stat-card hardware" style={{ flex: 0.5 }}>
            <TeamOutlined
              className="stat-icon-3d"
              style={{ color: "#6366f1" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Text className="stat-label">TỔNG NHÂN SỰ</Text>
              <Title level={2} style={{ margin: 0 }}>
                {pagination.total}
              </Title>
            </div>
            <div
              className="stat-progress"
              style={{ background: "#6366f1" }}
            ></div>
          </div>
        </div>

        {/* TABLE */}
        <Card className="glass-table-card-3d">
          <div className="table-header-3d">
            <div className="search-engine-3d">
              <SearchOutlined />
              <input
                placeholder="Tìm kiếm nhân viên nhanh..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              className="btn-submit-3d"
              onClick={handleSearch}
              style={{ minWidth: "100px" }}
            >
              LỌC KẾT QUẢ
            </Button>
            {/* <div className="sync-status"><span className="pulse-dot"></span> LIVE SYNC</div> */}
          </div>
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="employeeId"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              onChange: (page, pageSize) =>
                fetchApiData(page, searchText, pageSize),
            }}
            className="custom-table-3d"
            rowClassName="glass-row-3d"
          />
        </Card>
      </div>

      {/* ALLOCATION MODAL */}
      <Modal
        title={null}
        open={allocationModalOpen}
        onCancel={() => setAllocationModalOpen(false)}
        width={1100}
        footer={null}
        centered
        className="modal-3d-supreme"
        closable={false}
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>
          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="main-icon">
                <UserCircle />
              </div>
              <div className="particle p1"></div>
              <div className="particle p2"></div>
            </div>
          </div>
          <div className="modal-body-3d">
            {/* Header Profile */}
            <div
              className="modal-title-group"
              style={{ textAlign: "center", marginBottom: "30px" }}
            >
              <div className="user-icon-wrapper-3d">
                <User2Icon size={80} className="user-icon-emerald" />
              </div>
              <Title level={2} style={{ margin: 0 }}>
                {selectedEmployee?.fullName}
              </Title>
              <Space style={{ marginTop: 10 }}>
                <Tag color="blue">{selectedEmployee?.employeeId}</Tag>
                <Tag color="cyan">{selectedEmployee?.department}</Tag>
              </Space>
            </div>

            <Tabs
              defaultActiveKey="1"
              centered
              className="premium-tabs-cyan"
              onChange={(key) => {
                setActiveTab(key);
                setSelectedRowKeys([]);
              }}
            >
              {/* TAB 1: HARDWARE */}
              <Tabs.TabPane
                tab={
                  <span className="tab-label-3d-v2">
                    <DesktopOutlined /> PHẦN CỨNG
                  </span>
                }
                key="1"
              >
                <div className="tab-filter-bar">
                  <div className="filter-input-wrapper">
                    <SearchOutlined />
                    <input
                      placeholder="Lọc thiết bị..."
                      value={hwSearch}
                      onChange={(e) => setHwSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    opacity: selectedRowKeys.length > 0 ? 1 : 0,
                    height: selectedRowKeys.length > 0 ? "auto" : 0,
                    overflow: "hidden",
                    transition: "opacity 0.2s ease",
                    pointerEvents: selectedRowKeys.length > 0 ? "auto" : "none",
                  }}
                >
                  {selectedRowKeys.length > 0 && (
                    <div className="page-fade-in">
                      <Space>
                        <Text strong color="white">
                          Đã chọn {selectedRowKeys.length} thiết bị
                        </Text>
                        <Button
                          icon={<SwapOutlined />}
                          onClick={() => setTransferModalOpen(true)}
                          size="small"
                        >
                          Bàn giao
                        </Button>
                        <Button
                          icon={<QrcodeOutlined />}
                          onClick={handleDownloadQR}
                          size="small"
                          type="default"
                          style={{ color: "#06b6d4", borderColor: "#06b6d4" }}
                        >
                          Tải QR
                        </Button>
                        <Popconfirm
                          title={`Bạn có chắc muốn thu hồi ${selectedRowKeys.length} thiết bị này?`}
                          onConfirm={() => handleBulkRevoke("HW")}
                          okText="Thu hồi"
                          cancelText="Hủy"
                        >
                          <Button
                            danger
                            icon={<HistoryOutlined />}
                            size="small"
                          >
                            Thu hồi hàng loạt
                          </Button>
                        </Popconfirm>
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => setSelectedRowKeys([])}
                          style={{ color: "white" }}
                        />
                      </Space>
                    </div>
                  )}
                </div>

                <div className="table-wrapper-cyan">
                  <Table
                    rowSelection={{
                      selectedRowKeys,
                      onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    dataSource={filteredHardware}
                    loading={allocationLoading}
                    rowKey="assetId"
                    size="middle"
                    className="inner-table-cyan"
                    // Cấu hình Pagination Client-side
                    pagination={{
                      current: undefined, // Để Antd tự quản lý số trang
                      pageSize: innerPageSize,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20", "50"],
                      onChange: (_, size) => setInnerPageSize(size), // Đồng bộ size cho các tab khác
                      showTotal: (total) => `Tổng cộng ${total} thiết bị`,
                      position: ["bottomRight"],
                    }}
                  >
                    <Table.Column
                      title="TAG"
                      dataIndex="assetTag"
                      render={(t) => <Tag color="cyan">{t}</Tag>}
                    />
                    <Table.Column
                      title="MODEL"
                      dataIndex="modelName"
                      render={(t, r: any) => (
                        <div>
                          <div style={{ fontWeight: 600 }}>{t}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            S/N: {r.serial}
                          </div>
                        </div>
                      )}
                    />
                    <Table.Column
                      title="NGÀY CẤP"
                      dataIndex="assignedDate"
                      render={(d) => dayjs(d).format("DD/MM/YYYY")}
                    />
                    <Table.Column
                      align="right"
                      render={(record) => (
                        <Popconfirm
                          title="Thu hồi lẻ?"
                          onConfirm={() => handleRevokeAssignment(record, "HW")}
                        >
                          <Button
                            type="link"
                            danger
                            disabled={selectedRowKeys.length > 0}
                          >
                            Thu hồi
                          </Button>
                        </Popconfirm>
                      )}
                    />
                  </Table>
                </div>
              </Tabs.TabPane>

              {/* TAB 2: SOFTWARE */}
              <Tabs.TabPane
                tab={
                  <span className="tab-label-3d-v2">
                    <SafetyCertificateFilled /> PHẦN MỀM
                  </span>
                }
                key="2"
              >
                <div className="tab-filter-bar">
                  <div className="filter-input-wrapper">
                    <SearchOutlined />
                    <input
                      placeholder="Lọc phần mềm..."
                      value={swSearch}
                      onChange={(e) => setSwSearch(e.target.value)}
                    />
                  </div>
                </div>

                {selectedRowKeys.length > 0 && (
                  <div className="bulk-action-panel-cyan">
                    <Space>
                      <Text strong color="white">
                        Đã chọn {selectedRowKeys.length} bản quyền
                      </Text>
                      <Button
                        icon={<SwapOutlined />}
                        onClick={() => setTransferModalOpen(true)}
                        size="small"
                      >
                        Bàn giao
                      </Button>
                      <Popconfirm
                        title={`Gỡ bỏ ${selectedRowKeys.length} bản quyền đã chọn?`}
                        onConfirm={() => handleBulkRevoke("SW")}
                      >
                        <Button
                          danger
                          icon={<SafetyCertificateFilled />}
                          size="small"
                        >
                          Thu hồi hàng loạt
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                )}

                <div className="table-wrapper-cyan">
                  <Table
                    rowSelection={{
                      selectedRowKeys,
                      onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    dataSource={filteredSoftware}
                    rowKey="licenseId"
                    size="middle"
                    className="inner-table-cyan"
                    pagination={{
                      pageSize: innerPageSize,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20", "50"],
                      onChange: (_, size) => setInnerPageSize(size),
                      showTotal: (total) => `Tổng cộng ${total} bản quyền`,
                    }}
                  >
                    <Table.Column
                      title="TÊN PHẦN MỀM"
                      dataIndex="softwareName"
                      render={(t) => <Text strong>{t}</Text>}
                    />
                    <Table.Column title="TÀI KHOẢN" dataIndex="username" />
                    <Table.Column
                      align="right"
                      render={(record) => (
                        <Popconfirm
                          title="Gỡ bỏ quyền?"
                          onConfirm={() => handleRevokeAssignment(record, "SW")}
                        >
                          <Button
                            type="link"
                            danger
                            disabled={selectedRowKeys.length > 0}
                          >
                            Thu hồi
                          </Button>
                        </Popconfirm>
                      )}
                    />
                  </Table>
                </div>
              </Tabs.TabPane>

              {/* TAB 3: CONSUMABLES */}
              <Tabs.TabPane
                tab={
                  <span className="tab-label-3d-v2">
                    <BgColorsOutlined /> VẬT TƯ
                  </span>
                }
                key="3"
              >
                <div
                  style={{
                    opacity: selectedRowKeys.length > 0 ? 1 : 0,
                    height: selectedRowKeys.length > 0 ? "auto" : 0,
                    overflow: "hidden",
                    transition: "opacity 0.2s ease",
                    pointerEvents: selectedRowKeys.length > 0 ? "auto" : "none",
                  }}
                >
                  {selectedRowKeys.length > 0 && (
                    <div className="page-fade-in">
                      <Space>
                        <Text strong style={{ color: "white" }}>
                          Đã chọn {selectedRowKeys.length} vật tư
                        </Text>

                        <Button
                          icon={<SwapOutlined />}
                          onClick={() => setTransferModalOpen(true)}
                          size="small"
                        >
                          Bàn giao
                        </Button>

                        {/* NÚT THU HỒI HÀNG LOẠT MỚI THÊM */}
                        <Popconfirm
                          title={`Hoàn tác ${selectedRowKeys.length} cấp phát này?`}
                          onConfirm={handleBulkRevokeConsumable}
                          okText="Đồng ý"
                          cancelText="Hủy"
                        >
                          <Button
                            danger
                            icon={<HistoryOutlined />}
                            size="small"
                          >
                            Thu hồi hàng loạt
                          </Button>
                        </Popconfirm>

                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => {
                            setSelectedRowKeys([]);
                            setSelectedConsumables([]);
                          }}
                          style={{ color: "white" }}
                        />
                      </Space>
                    </div>
                  )}
                </div>

                <div className="table-wrapper-cyan">
                  <Table
                    rowSelection={{
                      selectedRowKeys,
                      onChange: (keys, selectedRows) => {
                        setSelectedRowKeys(keys);
                        setSelectedConsumables(selectedRows);
                      },
                    }}
                    dataSource={allocationData?.consumables}
                    rowKey="transactionId"
                    size="middle"
                    className="inner-table-cyan"
                    pagination={{
                      pageSize: innerPageSize,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20", "50"],
                      onChange: (_, size) => setInnerPageSize(size),
                      showTotal: (total) => `Tổng cộng ${total} vật tư`,
                    }}
                  >
                    {/* Thêm cột này vào Table.Column của Tab 3 */}
                    <Table.Column title="VẬT TƯ" dataIndex="consumableName" />
                    <Table.Column
                      title="SỐ LƯỢNG"
                      render={(_, r: any) => `${r.quantity} ${r.unit}`}
                    />
                    <Table.Column
                      title="NGÀY CẤP"
                      dataIndex="transactionDate"
                      render={(d) => dayjs(d).format("DD/MM/YYYY")}
                    />
                    <Table.Column
                      title="SỐ LƯỢNG CHUYỂN"
                      render={(_, record: any) => {
                        const isSelected = selectedRowKeys.includes(
                          record.transactionId,
                        );
                        return (
                          <InputNumber
                            min={1}
                            max={record.quantity}
                            value={
                              transferQuantities[record.transactionId] ||
                              record.quantity
                            }
                            disabled={!isSelected} // Chỉ cho phép edit khi đã tích chọn
                            onChange={(val) =>
                              handleQuantityChange(
                                record.transactionId,
                                val || 1,
                                record.quantity,
                              )
                            }
                            status={isSelected ? "warning" : ""}
                            style={{ width: 80, borderRadius: 6 }}
                          />
                        );
                      }}
                    />
                    <Table.Column
                      align="right"
                      render={(record) => (
                        <Popconfirm
                          title="Hoàn tác cấp phát?"
                          onConfirm={() =>
                            handleRevokeConsumable(record.transactionId)
                          }
                        >
                          <Button
                            type="link"
                            danger
                            disabled={selectedRowKeys.length > 0}
                          >
                            Hoàn tác
                          </Button>
                        </Popconfirm>
                      )}
                    />
                  </Table>
                </div>
              </Tabs.TabPane>
            </Tabs>

            <div style={{ marginTop: 30, textAlign: "center" }}>
              <Button
                className="btn-cancel-3d"
                onClick={() => setAllocationModalOpen(false)}
              >
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal
        title={
          <div className="modal-title-group">
            <Title
              level={4}
              style={{ color: "var(--cyan-primary)", margin: 0 }}
            >
              <SwapOutlined /> XÁC NHẬN BÀN GIAO
            </Title>
          </div>
        }
        destroyOnHidden
        open={transferModalOpen}
        onCancel={() => setTransferModalOpen(false)}
        onOk={handleBulkTransfer}
        confirmLoading={transferLoading}
        okText="Bắt đầu bàn giao"
        cancelText="Hủy"
        centered
        width={500}
        // Thêm className để nhận CSS đặc thù nếu cần
        className="modal-3d-supreme transfer-modal-sync"
        okButtonProps={{
          className: "tag-3d-cyan-bold", // Sử dụng class gradient bạn đã có
          style: { height: 38, border: "none" },
        }}
        cancelButtonProps={{
          style: { borderRadius: 10 },
        }}
      >
        <div className="modal-body-3d" style={{ padding: "20px 0" }}>
          <div className="modal-top-decor" style={{ height: 4 }}></div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 16 }}>
              Đang chuyển{" "}
              <b style={{ color: "var(--cyan-dark)" }}>
                {selectedRowKeys.length}
              </b>{" "}
              vật tư/tài sản
            </p>
            {/* Thẻ hiển thị người gửi (From) */}
            <div
              className="transfer-from-card"
              style={{
                background: "var(--cyan-light)",
                padding: "10px 15px",
                borderRadius: 12,
                border: "1px solid rgba(8, 145, 178, 0.1)",
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                TỪ NHÂN VIÊN (NGƯỜI GỬI):
              </Text>
              <div style={{ fontWeight: 700, color: "var(--cyan-primary)" }}>
                {selectedEmployee?.fullName}{" "}
                <small>({selectedEmployee?.employeeId})</small>
              </div>
            </div>
          </div>
          <Text strong style={{ color: "var(--cyan-dark)", fontSize: 13 }}>
            <UserAddOutlined /> CHỌN NHÂN VIÊN NHẬN BÀN GIAO:
          </Text>

          <Text strong style={{ color: "var(--cyan-dark)", fontSize: 13 }}>
            CHỌN NHÂN VIÊN NHẬN BÀN GIAO (NGƯỜI NHẬN):
          </Text>

          <Select
            showSearch
            className="select-3d-cyan"
            style={{ width: "100%", marginTop: 10, height: 45 }}
            placeholder="Tìm mã hoặc tên nhân viên..."
            filterOption={false} // Tắt lọc client
            onSearch={(val) => {
              setTransferEmpSearch(val);
              debouncedTransferSearch(val);
            }}
            onChange={(val) => setTargetEmployeeId(val)}
            loading={transferEmpLoading}
            notFoundContent={transferEmpLoading ? <Spin size="small" /> : null}
            dropdownStyle={{ borderRadius: 12, padding: 8 }}
            // Infinite Scroll: Khi cuộn dropdown xuống cuối
            onPopupScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              if (
                scrollHeight - scrollTop <= clientHeight + 10 &&
                transferEmpHasMore &&
                !transferEmpLoading
              ) {
                loadTransferEmployees(
                  transferEmpSearch,
                  transferEmpPage + 1,
                  true,
                );
              }
            }}
          >
            {transferEmpList.map((emp) => (
              <Select.Option key={emp.employeeId} value={emp.employeeId}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    <b style={{ color: "var(--cyan-dark)" }}>
                      {emp.employeeId}
                    </b>{" "}
                    - {emp.fullName}
                  </span>
                  <Tag
                    className="mfr-chip-cyan"
                    style={{ margin: 0, fontSize: 10 }}
                  >
                    {emp.department}
                  </Tag>
                </div>
              </Select.Option>
            ))}

            {transferEmpLoading && transferEmpPage > 1 && (
              <Select.Option
                disabled
                key="loading-more"
                style={{ textAlign: "center" }}
              >
                <Spin size="small" />
              </Select.Option>
            )}
          </Select>
          <div style={{ marginTop: 20 }}>
            <Text strong style={{ color: "var(--cyan-dark)", fontSize: 13 }}>
              <EnvironmentOutlined /> CHỌN VỊ TRÍ BÀN GIAO (LOCATION):
            </Text>
            <Select
              showSearch
              className="select-3d-cyan"
              style={{ width: "100%", marginTop: 10, height: 45 }}
              placeholder="Chọn phòng ban / Vị trí bàn giao..."
              value={targetLocation}
              onChange={(val) => setTargetLocation(val)}
              allowClear
            >
              {locations.map((loc: Location) => (
                <Select.Option key={loc.id} value={loc.locationName}>
                  <Space>
                    <EnvironmentOutlined
                      style={{ color: "var(--cyan-primary)" }}
                    />
                    {loc.locationName}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>
          {/* Danh sách vật tư thu gọn */}
          <div
            className="transfer-summary-list"
            style={{
              marginTop: 20,
              maxHeight: 150,
              overflowY: "auto",
              padding: "0 10px",
              background: "rgba(0,0,0,0.02)",
              borderRadius: 10,
            }}
          >
            {selectedConsumables.map((item) => (
              <div
                key={item.transactionId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px dashed rgba(8, 145, 178, 0.2)",
                }}
              >
                <Text style={{ fontSize: "12px" }}>{item.consumableName}</Text>
                <Text strong style={{ color: "var(--cyan-dark)" }}>
                  x{transferQuantities[item.transactionId] || item.quantity}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeList;
