import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Card,
  Typography,
  Tag,
  Popconfirm,
  message,
  Select,
  Statistic,
  Progress,
  Row,
  Col,
  DatePicker,
  Tooltip,
  Upload,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  VerifiedOutlined,
  AppstoreAddOutlined,
  TeamOutlined,
  UserAddOutlined,
  RetweetOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  KeyOutlined,
  GlobalOutlined,
  HistoryOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "../CSS/GlobalStyle.css";
import * as XLSX from "xlsx";
// Import Services & Types
import {
  softwareLicenseService,
  type LicenseUsageDto,
  type SoftwareLicense,
} from "../services/useSoftwareLicenseService";
import { vendorService } from "../services/useVendorService";
import { assignmentService } from "../services/assignmentService";
import { employeeService } from "../services/employeeService";
import axiosClient from "../axiosClient";

const { Title, Text } = Typography;
const { Option } = Select;

const SoftwareLicenseList: React.FC = () => {
  const [form] = Form.useForm();

  // --- MAIN STATES ---
  const [data, setData] = useState<SoftwareLicense[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [tableParams, setTableParams] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    expiryFilter: "all",
    seatFilter: "all",
  });
  const [searchInput, setSearchInput] = useState("");

  // --- MODAL & UI STATES ---
  const [_, setVendors] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SoftwareLicense | null>(
    null,
  );
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [empSearchText, setEmpSearchText] = useState("");
  // --- EMPLOYEE MODAL STATES ---
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [empData, setEmpData] = useState<LicenseUsageDto[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empTotal, setEmpTotal] = useState<number>(0);
  const [empPageSize, setEmpPageSize] = useState(10);
  const [isAssigning, setIsAssigning] = useState(false); // Chuyển đổi view trong modal
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<
    Array<string | number>
  >([]); // Lưu các NV được chọn
  const [allEmployees, setAllEmployees] = useState<any[]>([]); // Danh sách tất cả NV để chọn
  const [assignLoading, setAssignLoading] = useState(false);
  // Thêm vào cùng nhóm với các Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  // Tính toán số lượng slot còn lại của License đang chọn
  const availableSeats = useMemo(() => {
    if (!selectedItem) return 0;
    const total = selectedItem.totalSeats || 0;
    const used = selectedItem.usedSeats || 0;
    return Math.max(total - used, 0);
  }, [selectedItem]);

  // Kiểm tra xem đã chọn đủ số lượng cho phép chưa
  const isFullSelection = selectedEmployeeIds.length >= availableSeats;

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [empPage, setEmpPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRevokeKeys, setSelectedRevokeKeys] = useState<any[]>([]);

  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosClient.get(
        "SoftwareLicense/download-license-template",
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Mau_Import_License.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success("Tải xuống file Excel mẫu thành công!");
    } catch (error) {
      message.error("Không thể tải file mẫu");
    }
  };
  const handleDownloadEmployees = async () => {
    try {
      const response = await axiosClient.get(
        "SoftwareLicense/download-employee-template",
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Template_Nhan_Vien_Vinatech.xlsx");

      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("Tải xuống file Excel nhập ds thành công!");
    } catch (error) {
      message.error("Không thể tải file mẫu. Vui lòng kiểm tra lại server.");
    }
  };

  // --- FETCH DATA ---
  // Tách từng field thay vì dùng object
  const fetchApiData = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await softwareLicenseService.getAll({
        pageNumber: tableParams.page,
        pageSize: tableParams.pageSize,
        searchTerm: tableParams.search || undefined,
        expiryFilter:
          tableParams.expiryFilter !== "all"
            ? tableParams.expiryFilter
            : undefined,
      });
      const result = response.data?.data || response.data;
      setData(result?.items || []);
      setTotalItems(result?.totalCount || 0);
    } catch (err) {
      message.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
    // ← dùng từng field primitive thay vì object
  }, [
    tableParams.page,
    tableParams.pageSize,
    tableParams.search,
    tableParams.expiryFilter,
  ]);

  const fetchAllEmployees = async (reset = false) => {
    if (empLoading || (!hasMore && !reset)) return;
    setEmpLoading(true);
    try {
      const pageToFetch = reset ? 1 : empPage;
      const res = await employeeService.getLookupPaged(
        empSearchText,
        pageToFetch,
        20,
      );

      // LỌC BỎ CÁC DÒNG RỖNG (Quan trọng)
      const rawItems = res.items || res.data || (Array.isArray(res) ? res : []);
      const newItems = rawItems.filter(
        (item: any) => item.employeeId && item.employeeId.trim() !== "",
      );

      if (reset) {
        setAllEmployees(newItems);
        setEmpPage(2);
      } else {
        setAllEmployees((prev) => [...prev, ...newItems]);
        setEmpPage((prev) => prev + 1);
      }
      setHasMore(newItems.length > 0);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setEmpLoading(false);
    }
  };

  // Reset và gọi lại khi mở mode Assign hoặc khi Search thay đổi
  useEffect(() => {
    if (isAssigning) {
      fetchAllEmployees(true);
    }
  }, [isAssigning, empSearchText]); // Thêm empSearchText để search Server-side nếu cần

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      fetchAllEmployees();
    }
  };
  // --- NEW HANDLERS FOR ASSIGNMENT ---

  const handleRevoke = async (record: any) => {
    try {
      const licenseId = Number(selectedItem?.id);
      if (!licenseId) return;

      await assignmentService.revoke(
        null,
        licenseId,
        record.employeeId,
        "Thu hồi định kỳ",
      );

      message.success(
        `Đã thu hồi thành công license từ ${record.employeeName}`,
      );

      // CẬP NHẬT UI:
      setEmpPage(1); // Reset state cho UI đồng bộ
      setEmpSearchText(""); // Clear search để chắc chắn thấy data mới

      // QUAN TRỌNG: Gọi fetch và ÉP lấy trang 1, clear search
      await fetchEmployeesByLicense(licenseId, 1, true);

      if (fetchApiData) fetchApiData();
    } catch (error) {
      message.error("Lỗi khi thực hiện thu hồi");
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedRevokeKeys.length === 0) return;

    // Đảm bảo lấy đúng ID, nếu bảng dùng 'licenseId' thì dùng 'licenseId'
    const licenseId = Number(selectedItem?.id || selectedItem?.id);
    if (!licenseId) {
      message.error("Không tìm thấy thông tin License");
      return;
    }

    try {
      setEmpLoading(true);

      // 1. Gọi Service thu hồi
      await assignmentService.revokeLicenseMultiple({
        licenseId: licenseId,
        employeeIds: selectedRevokeKeys.map((key) => String(key).trim()),
        note: "Thu hồi hàng loạt từ danh sách nhân viên",
      });

      message.success(
        `Đã thu hồi thành công ${selectedRevokeKeys.length} bản quyền`,
      );

      // 2. RESET TRẠNG THÁI CHỌN
      setSelectedRevokeKeys([]);
      setEmpSearchText(""); // Xóa search để người dùng thấy danh sách mới đầy đủ
      setEmpPage(1);

      // 3. CẬP NHẬT DỮ LIỆU ĐỒNG BỘ
      // Gọi fetch danh sách nhân viên đang dùng (View 1)
      // Ép về trang 1 để tránh lỗi phân trang sau khi xóa bớt bản ghi
      await fetchEmployeesByLicense(licenseId, 1, true);

      // 4. CẬP NHẬT SLOT Ở TRANG CHỦ (View tổng)
      // Đây là bước quan trọng để số lượng "Used Seats" ở bảng ngoài được cập nhật
      if (typeof fetchApiData === "function") {
        await fetchApiData();
      }
    } catch (error) {
      const errorMsg = "Lỗi khi thực hiện thu hồi hàng loạt";
      message.error(errorMsg);
    } finally {
      setEmpLoading(false);
    }
  };
  // Cập nhật hàm Cấp phát hàng loạt
  const handleConfirmAssign = async () => {
    if (!selectedItem || selectedEmployeeIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một nhân viên");
      return;
    }

    setAssignLoading(true);
    try {
      const payload = {
        licenseId: Number(selectedItem.id),
        employeeIds: selectedEmployeeIds.map(String), // Chuyển sang string array cho backend
        condition: "Good",
      };

      await assignmentService.assignMultiple(payload);

      message.success(`Đã cấp phát thành công...`);

      setIsAssigning(false);
      setSelectedEmployeeIds([]);
      setEmpSearchText(""); // Xóa search để tránh filter nhầm người mới

      // QUAN TRỌNG: Đưa về trang 1
      setEmpPage(1);

      // Nếu fetchEmployeesByLicense phụ thuộc vào empPage,
      // việc setEmpPage(1) sẽ trigger useEffect (nếu bạn có đặt nó trong useEffect)
      // Hoặc gọi trực tiếp với ID
      await fetchEmployeesByLicense(Number(selectedItem.id), 1, true);
      if (fetchApiData) fetchApiData();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi khi cấp phát bản quyền",
      );
    } finally {
      setAssignLoading(false);
    }
  };
  const downloadEmployeeUsageExcel = async () => {
    // 1. Kiểm tra xem đã chọn License chưa
    if (!selectedItem?.id) {
      message.warning("Vui lòng chọn một phần mềm/license để tải xuống");
      return;
    }

    // Bật loading nếu cần (hiệu ứng chờ)
    const hide = message.loading("Đang khởi tạo dữ liệu Excel...", 0);

    try {
      // 2. Gọi trực tiếp API vừa tạo
      // Sử dụng endpoint: SoftwareLicense/holders/{id}
      const response = await axiosClient.get(
        `Assignment/holders/${selectedItem.id}`,
      );

      if (response.data.success) {
        const apiData = response.data.data; // Đây là List<LicenseHolderDto>

        if (!apiData || apiData.length === 0) {
          message.warning("Không có dữ liệu sử dụng cho license này");
          hide();
          return;
        }

        // 3. Mapping dữ liệu từ DTO (API) sang Header tiếng Việt
        // Chú ý: Sử dụng đúng tên trường từ LicenseHolderDto: employeeId, employeeName, department
        const worksheetData = apiData.map((item: any) => ({
          "Mã Nhân Viên": item.employeeId,
          "Tên Nhân Viên": item.employeeName,
          "Bộ Phận": item.department, // Theo đúng DTO trong Service
          "Phần Mềm": selectedItem?.softwareName || "N/A",
        }));

        // 4. Xử lý Excel bằng thư viện XLSX
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);

        // Định dạng độ rộng cột
        worksheet["!cols"] = [
          { wch: 15 }, // Mã NV
          { wch: 25 }, // Tên NV
          { wch: 30 }, // Bộ phận
          { wch: 30 }, // Phần mềm
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Usage");

        // 5. Tạo tên file và xuất bản
        const fileName = `Usage_${selectedItem.softwareName?.replace(/[^\w\s]/g, "")}_${new Date().getTime()}.xlsx`;

        XLSX.writeFile(workbook, fileName);
        message.success("Tải xuống file Excel thành công!");
      } else {
        message.error("Lấy dữ liệu từ máy chủ thất bại");
      }
    } catch (error) {
      console.error("Download Excel Error:", error);
      message.error("Có lỗi xảy ra khi gọi API tải dữ liệu");
    } finally {
      hide(); // Tắt thông báo loading
    }
  };

  const handleUploadAssignList = async (file: File) => {
    const hide = message.loading("Đang kiểm tra danh sách nhân viên...", 0);

    try {
      const licenseId = selectedItem?.id;
      if (licenseId === undefined || licenseId === null) {
        message.error("Không tìm thấy thông tin License");
        return;
      }
      // 1. Gọi API lấy TOÀN BỘ người đang dùng (không phân trang)
      // Bạn có thể sửa API getUsage để truyền pageSize = 9999 hoặc tạo endpoint mới
      const res = await softwareLicenseService.getUsage(licenseId, {
        page: 1,
        pageSize: 99999, // Lấy hết để so sánh
      });

      const allCurrentHolderIds =
        res.data?.items?.map((item: any) => item.employeeId?.toString()) || [];

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const json: any[] = XLSX.utils.sheet_to_json(
          workbook.Sheets[sheetName],
        );

        // 2. Lấy ID từ Excel
        const excelIds = json
          .map((row) => row["Mã Nhân Viên"]?.toString().trim())
          .filter(Boolean);

        // 3. Lọc bỏ những người ĐÃ CÓ bản quyền (so sánh với danh sách FULL từ API)
        const validNewIds = excelIds.filter(
          (id) => !allCurrentHolderIds.includes(id),
        );

        // 4. Tính toán slot dựa trên con số tổng (empTotal) từ server
        const remainingSlots =
          Number(selectedItem?.totalSeats) - allCurrentHolderIds.length;

        if (validNewIds.length > remainingSlots) {
          const takeIds = validNewIds.slice(0, remainingSlots);
          setSelectedEmployeeIds(takeIds);
          message.warning(
            `Vượt quá slot trống. Chỉ thêm được ${takeIds.length} người mới.`,
          );
        } else {
          setSelectedEmployeeIds(validNewIds);
          message.success(`Đã chọn ${validNewIds.length} nhân viên hợp lệ.`);
        }
        hide();
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      hide();
      message.error("Không thể kiểm tra danh sách nhân viên hiện tại");
    }

    return false;
  };

  const fetchVendors = useCallback(async () => {
    try {
      const response: any = await vendorService.getAll();
      const result = response.data?.data || response.data || [];
      setVendors(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchEmployeesByLicense = useCallback(
    async (
      licenseId: number,
      overridePage?: number,
      clearSearch: boolean = false,
    ) => {
      setEmpLoading(true);
      try {
        const targetPage = overridePage !== undefined ? overridePage : empPage;
        const targetSearch = clearSearch ? "" : empSearchText;

        const res = await softwareLicenseService.getUsage(licenseId, {
          page: targetPage,
          pageSize: empPageSize, // ← đổi từ empParams.pageSize
          search: targetSearch,
        });

        if (res.data) {
          setEmpData(res.data.items || []);
          setEmpTotal(Number(res.data.totalCount) || 0);
        }
      } catch (error) {
        message.error("Không thể tải danh sách nhân viên");
      } finally {
        setEmpLoading(false);
      }
    },
    [empPage, empPageSize, empSearchText],
  ); // ← thêm empPageSize vào deps

  const handleSearch = () => {
    setTableParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  useEffect(() => {
    fetchApiData();
  }, [fetchApiData]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    if (isEmployeeModalOpen && selectedItem) {
      fetchEmployeesByLicense(Number(selectedItem.id));
    }
  }, [
    isEmployeeModalOpen,
    selectedItem,
    empPage,
    empPageSize,
    fetchEmployeesByLicense,
  ]); // ← thêm empPageSize

  // --- HANDLERS ---
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
      };
      if (selectedItem) {
        await softwareLicenseService.update(Number(selectedItem.id), payload);
        message.success("Cập nhật thành công");
      } else {
        await softwareLicenseService.create(payload);
        message.success("Thêm license mới thành công");
      }
      setIsModalOpen(false);
      fetchApiData();
    } catch (error) {
      message.error("Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    message.success({
      content: "Đã sao chép vào clipboard",
      icon: <CopyOutlined style={{ color: "#10b981" }} />,
      duration: 1.5,
    });
  };

  const stats = useMemo(() => {
    const expiring = data.filter((item) => {
      if (!item.isSubscription || !item.expiryDate) return false;
      const days = dayjs(item.expiryDate).diff(dayjs(), "day");
      return days >= 0 && days <= 30;
    }).length;
    const fullSeats = data.filter(
      (item) => (item.usedSeats || 0) >= (item.totalSeats || 1),
    ).length;
    return { expiring, fullSeats };
  }, [data]);

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: "PHẦN MỀM & KEY",
      key: "software",
      width: "40%",
      render: (record: SoftwareLicense) => (
        <div className="asset-info-cell-3d">
          <div className="icon-box-3d">
            <AppstoreAddOutlined />
          </div>
          <div className="info-main">
            <Text strong className="name-3d">
              {record.softwareName}
            </Text>
            <div
              className="sub-path"
              style={{
                marginTop: "4px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <Tooltip title="Click để ẩn/hiện Key">
                <span
                  className="key-text-3d"
                  style={{
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                  onClick={() =>
                    setVisibleKeys((p) => ({
                      ...p,
                      [record.id!]: !p[record.id!],
                    }))
                  }
                >
                  <KeyOutlined />{" "}
                  {visibleKeys[record.id!]
                    ? record.productKey
                    : "••••-••••-••••"}
                </span>
              </Tooltip>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={(e) => handleCopyKey(e, record.productKey ?? "")}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "ĐANG SỬ DỤNG",
      key: "seats",
      width: 250,
      render: (record: SoftwareLicense) => {
        const used = record.usedSeats || 0;
        const total = record.totalSeats || 1;
        const percent = Math.min(Math.round((used / total) * 100), 100);
        const isFull = used >= total;

        return (
          <div className="stock-display-3d">
            <div className={`depreciation-tag-3d ${isFull ? "low" : ""}`}>
              <span className="value">{used}</span>
              <span
                className="unit"
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#ffffff",
                }}
              >
                / {total}
              </span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor={
                isFull ? "#f43f5e" : percent > 80 ? "#f59e0b" : "#10b981"
              }
              strokeWidth={6}
            />
          </div>
        );
      },
    },
    {
      title: "THỜI HẠN",
      key: "expiry",
      width: 180,
      render: (record: SoftwareLicense) => {
        if (!record.isSubscription || !record.expiryDate)
          return (
            <div className="type-pill-3d">
              <div className="dot" style={{ background: "#10b981" }}></div> Vĩnh
              viễn
            </div>
          );
        const diff = dayjs(record.expiryDate).diff(dayjs(), "day");
        const status = diff < 0 ? "expired" : diff <= 30 ? "urgent" : "safe";

        return (
          <div
            className={`expiry-card-premium ${status}`}
            style={{
              padding: "8px 12px",
              borderRadius: "12px",
              background: "white",
              border: "1px solid #f1f5f9",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700 }}>
              <ClockCircleOutlined />{" "}
              {dayjs(record.expiryDate).format("DD/MM/YYYY")}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: diff < 0 ? "#f43f5e" : "#94a3b8",
              }}
            >
              {diff < 0 ? "Hết hạn" : `Còn ${diff} ngày`}
            </div>
          </div>
        );
      },
    },
    // {
    //   title: "TÀI KHOẢN",
    //   key: "username",
    //   width: 180,
    //   render: (record: SoftwareLicense) => (
    //     <div className="asset-info-cell-3d">
    //       <div className="info-main">
    //         {record.username ? (
    //           <div
    //             style={{ display: "flex", alignItems: "center", gap: "6px" }}
    //           >
    //             <span
    //               className="type-pill-3d"
    //               style={{
    //                 background: "#f8fafc",
    //                 border: "1px solid #e2e8f0",
    //                 color: "#475569",
    //               }}
    //             >
    //               <UserOutlined style={{ marginRight: "4px" }} />
    //               {record.username}
    //             </span>
    //             {/* <Button
    //               type="text"
    //               size="small"
    //               icon={<CopyOutlined style={{ fontSize: '12px' }} />}
    //               onClick={(e) => {
    //                 e.stopPropagation();
    //                 navigator.clipboard.writeText(record.username || '');
    //                 message.success('Đã sao chép tài khoản');
    //               }}
    //             /> */}
    //           </div>
    //         ) : (
    //           <Text type="secondary" italic style={{ fontSize: "12px" }}>
    //             Chưa cập nhật
    //           </Text>
    //         )}
    //       </div>
    //     </div>
    //   ),
    // },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right" as const,
      width: 150,
      render: (record: SoftwareLicense) => (
        <Space size="middle" orientation="horizontal">
          {/* direction="horizontal" (mặc định) nay nên khai báo rõ là orientation nếu version của bạn yêu cầu, 
      hoặc chỉ cần <Space size="middle"> là đủ vì mặc định nó đã nằm ngang rồi */}

          <Tooltip title="Xem tài khoản đăng nhập">
            <Button
              className="btn-3d"
              style={{ color: "#6366f1" }}
              icon={<KeyOutlined />}
              onClick={() => {
                setSelectedItem(record);
                setIsAccountModalOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Danh sách nhân viên">
            <Button
              className="btn-3d"
              icon={<TeamOutlined />}
              style={{ color: "#e832c9" }}
              onClick={() => {
                setSelectedItem(record);
                setIsEmployeeModalOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Chỉnh sửa">
            <Button
              className="btn-3d"
              style={{ color: "#3b82f6" }}
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedItem(record);
                // Lưu ý: Đảm bảo Modal edit có prop forceRender hoặc
                // sử dụng setTimeout để Form kịp mount trước khi setFieldsValue
                setIsModalOpen(true);
                setTimeout(() => {
                  form.setFieldsValue({
                    ...record,
                    expiryDate: record.expiryDate
                      ? dayjs(record.expiryDate)
                      : null,
                  });
                }, 0);
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Xác nhận xóa"
            okButtonProps={{ danger: true }}
            onConfirm={() =>
              softwareLicenseService
                .delete(Number(record.id))
                .then(() => {
                  message.success("Xóa license thành công!"); // Hiện thông báo thành công
                  fetchApiData(); // Tải lại dữ liệu bảng
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Xóa license thất bại!"); // Hiện thông báo nếu có lỗi xảy ra
                })
            }
          >
            <Tooltip title="Xóa">
              <Button
                className="btn-3d"
                style={{ color: "#f43f5e" }}
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-page-container">
      <div className="page-fade-in">
        {/* --- BENTO HEADER --- */}
        <div className="bento-header-wrapper">
          <div className="bento-card welcome-banner">
            <div className="banner-content">
              <div className="banner-badge">
                <VerifiedOutlined /> VINATECH LICENSE HUB
              </div>
              <Title level={2} className="banner-title">
                License Manager
              </Title>
              <Text className="banner-subtitle">
                Hệ thống quản lý bản quyền phần mềm tập trung
              </Text>
              <Space
                vertical
                style={{ marginTop: 20, width: "100%" }}
                size="middle"
              >
                <Space wrap>
                  {/* Gom các nút Tải vào 1 Dropdown */}
                  <Button
                    className="btn-glass-secondary"
                    onClick={handleDownloadTemplate} // Gọi trực tiếp hàm tải file mẫu nhập key
                  >
                    <Space>
                      <DownloadOutlined />
                      Tải file mẫu nhập key
                    </Space>
                  </Button>
                  {/* Nút Nhập nổi bật hơn */}
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => setIsImportModalOpen(true)}
                    className="btn-glass-primary" // Có thể đổi màu để phân biệt với nút Tải
                  >
                    Nhập DS key
                  </Button>
                </Space>
              </Space>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedItem(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
              className="btn-submit-3d"
              style={{ height: "50px", width: "250px" }}
            >
              THÊM LICENSE
            </Button>
          </div>

          <div className="bento-card stat-card">
            <Statistic
              title="Tổng License"
              value={totalItems}
              prefix={<GlobalOutlined style={{ color: "#10b981" }} />}
            />
          </div>
          <div className="bento-card stat-card">
            <Statistic
              title="Sắp hết hạn"
              value={stats.expiring}
              prefix={<HistoryOutlined style={{ color: "#f59e0b" }} />}
            />
          </div>
          <div className="bento-card stat-card">
            <Statistic
              title="Hết Seat"
              value={stats.fullSeats}
              prefix={<AlertOutlined style={{ color: "#f43f5e" }} />}
            />
          </div>
        </div>

        {/* --- MAIN TABLE 3D --- */}
        <div className="table-perspective-container">
          <Card className="glass-table-card-3d" variant="borderless">
            <div className="table-header-3d">
              <div className="search-engine-3d">
                <SearchOutlined />
                <input
                  placeholder="Tìm kiếm nhanh phần mềm, key..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                className="btn-submit-3d"
                onClick={handleSearch}
              >
                LỌC KẾT QUẢ
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="id"
              pagination={{
                current: tableParams.page,
                pageSize: tableParams.pageSize,
                total: totalItems,
                position: ["bottomRight"],
                showSizeChanger: true,
                showQuickJumper: false,
                showTotal: (total) => (
                  <Text strong style={{ color: "#64748b" }}>
                    Tổng cộng {total} bản ghi
                  </Text>
                ),
              }}
              onChange={(p) => {
                setTableParams({
                  ...tableParams,
                  // Nếu pageSize thay đổi so với hiện tại, reset về trang 1
                  page:
                    p.pageSize !== tableParams.pageSize ? 1 : p.current || 1,
                  pageSize: p.pageSize || 10,
                });
              }}
            />
          </Card>
        </div>
      </div>

      {/* --- MODAL: EDIT/CREATE (3D STYLE) --- */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={650}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>
          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="main-icon">
                <AppstoreAddOutlined />
              </div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>LICENSE CONFIGURATION</span>
              <h2>{selectedItem ? "Cập nhật License" : "Thêm License mới"}</h2>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Row gutter={[20, 0]}>
                <Col span={24}>
                  <Form.Item
                    name="softwareName"
                    label="Tên phần mềm"
                    rules={[{ required: true }]}
                  >
                    <Input
                      className="input-3d"
                      placeholder="VD: Visual Studio 2022 Professional"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="productKey"
                    label="Product Key"
                    rules={[{ required: true }]}
                  >
                    <Input className="input-3d" placeholder="XXXX-XXXX-XXXX" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="totalSeats"
                    label="Số slots"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" className="input-3d" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="isSubscription"
                    label="Loại bản quyền"
                    rules={[{ required: true }]}
                  >
                    <Select className="select-3d">
                      <Option value={false}>Vĩnh viễn</Option>
                      <Option value={true}>Thời hạn</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Form.Item
                  noStyle
                  shouldUpdate={(p, c) => p.isSubscription !== c.isSubscription}
                >
                  {({ getFieldValue }) =>
                    getFieldValue("isSubscription") && (
                      <Col span={8}>
                        <Form.Item name="expiryDate" label="Ngày hết hạn">
                          <DatePicker
                            style={{ width: "100%" }}
                            className="input-3d"
                          />
                        </Form.Item>
                      </Col>
                    )
                  }
                </Form.Item>

                <Col span={12}>
                  <Form.Item name="username" label="Username / Email">
                    <Input
                      className="input-3d"
                      placeholder="admin@vinatech.com.vn"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="password" label="Mật khẩu (Password)">
                    <Input.Password
                      className="input-3d"
                      placeholder="••••••••"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
                <Button
                  className="btn-cancel-3d"
                  style={{ flex: 1 }}
                  onClick={() => setIsModalOpen(false)}
                >
                  HỦY BỎ
                </Button>
                <Button
                  className="btn-submit-3d"
                  style={{ flex: 2 }}
                  onClick={() => form.submit()}
                >
                  XÁC NHẬN LƯU
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      {/* --- MODAL: EMPLOYEE USAGE & ASSIGNMENT (DUAL VIEW) --- */}
      <Modal
        title={null}
        open={isEmployeeModalOpen}
        onCancel={() => {
          setIsEmployeeModalOpen(false);
          setIsAssigning(false);
          setSelectedEmployeeIds([]);
          setAllEmployees([]);
          setEmpPage(1);
          setEmpPageSize(5); // ← thêm dòng này
        }}
        width={isAssigning ? 1200 : 1100}
        footer={null}
        className="modal-3d-supreme"
        closable={false}
        centered
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div
            className="modal-top-decor"
            style={{
              background: isAssigning
                ? "linear-gradient(90deg, #10b981, #3b82f6)"
                : "linear-gradient(90deg, #3b82f6, #2dd4bf)",
            }}
          ></div>

          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="main-icon">
                {isAssigning ? <UserAddOutlined /> : <TeamOutlined />}
              </div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group" style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span>
                    {isAssigning ? "NEW ALLOCATION" : "USAGE TRACKING"}
                  </span>
                  <h2>
                    {isAssigning
                      ? "Cấp phát bản quyền mới"
                      : "Nhân viên đang sử dụng"}
                  </h2>
                  <Text type="secondary">
                    <AppstoreAddOutlined /> {selectedItem?.softwareName}
                  </Text>
                </div>
                {isAssigning && (
                  <div className="selected-counter-3d">
                    Đã chọn: <b>{selectedEmployeeIds.length}</b> nhân viên
                  </div>
                )}
              </div>
            </div>

            {!isAssigning ? (
              <div className="page-fade-in">
                <div
                  style={{
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Space>
                    <Input
                      prefix={<SearchOutlined />}
                      placeholder="Tìm nhân viên..."
                      allowClear
                      className="input-3d"
                      style={{ width: 300 }}
                      value={empSearchText}
                      onChange={(e) => setEmpSearchText(e.target.value)}
                    />
                    {/* NÚT THU HỒI HÀNG LOẠT: Chỉ hiện khi có người được chọn */}
                    {selectedRevokeKeys.length > 0 && (
                      <Popconfirm
                        title={`Bạn có chắc chắn muốn thu hồi ${selectedRevokeKeys.length} bản quyền?`}
                        onConfirm={handleBulkRevoke}
                        okText="Xác nhận"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          danger
                          type="primary"
                          icon={<RetweetOutlined />}
                          className="btn-3d-revoke"
                        >
                          THU HỒI ({selectedRevokeKeys.length})
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>

                  <Button
                    icon={<DownloadOutlined />}
                    className="btn-excel-download"
                    onClick={downloadEmployeeUsageExcel}
                    size="large"
                  >
                    <span style={{ fontWeight: 600 }}>TẢI EXCEL</span>
                  </Button>
                </div>

                <Table
                  className="employee-table-styled"
                  rowSelection={{
                    // Sửa ở đây: Sử dụng đúng State mà nút Thu hồi đang check
                    selectedRowKeys: selectedRevokeKeys,
                    onChange: (keys: React.Key[]) => {
                      const formatted = keys.map((k) =>
                        typeof k === "bigint" ? k.toString() : k,
                      ) as (string | number)[];
                      setSelectedRevokeKeys(formatted);
                    },
                    preserveSelectedRowKeys: true,
                  }}
                  dataSource={empData.filter(
                    (item) =>
                      item.employeeName
                        ?.toLowerCase()
                        .includes(empSearchText.toLowerCase()) ||
                      item.employeeCode
                        ?.toLowerCase()
                        .includes(empSearchText.toLowerCase()),
                  )}
                  loading={empLoading}
                  rowKey={"employeeId"}
                  size="middle"
                  pagination={{
                    current: empPage,
                    pageSize: empPageSize, // ← đổi từ empParams.pageSize
                    total: empTotal,
                    position: ["bottomRight"],
                    showSizeChanger: true,
                    pageSizeOptions: ["5", "10", "20", "50"],
                    showTotal: (total) => (
                      <Text strong style={{ color: "#64748b" }}>
                        Tổng {total} bản ghi
                      </Text>
                    ),
                  }}
                  onChange={(p) => {
                    // Reset về trang 1 nếu đổi pageSize
                    if (p.pageSize !== empPageSize) {
                      setEmpPage(1);
                      setEmpPageSize(p.pageSize || 10);
                    } else {
                      setEmpPage(p.current || 1);
                    }
                  }}
                  columns={[
                    {
                      title: "Mã NV",
                      dataIndex: "employeeId",
                      render: (t) => (
                        <Text strong color="#3b82f6">
                          {t}
                        </Text>
                      ),
                    },
                    { title: "Họ và Tên", dataIndex: "employeeName" },
                    {
                      title: "Phòng ban",
                      dataIndex: "employeeDepartment",
                      render: (d) => <Tag color="blue">{d}</Tag>,
                    },
                    {
                      title: "Ngày cấp",
                      dataIndex: "transactionDate",
                      render: (d) => dayjs(d).format("DD/MM/YYYY"),
                    },
                    {
                      title: "Gỡ bỏ",
                      align: "center",
                      render: (record) => (
                        <Popconfirm
                          title="Thu hồi bản quyền này?"
                          onConfirm={() => handleRevoke(record)}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<RetweetOutlined />}
                          />
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
                <div
                  style={{
                    marginTop: "25px",
                    display: "flex",
                    gap: "15px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    className="btn-cancel-3d"
                    onClick={() => setIsEmployeeModalOpen(false)}
                  >
                    ĐÓNG
                  </Button>
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    className="btn-submit-3d"
                    onClick={() => setIsAssigning(true)}
                  >
                    CẤP PHÁT MỚI
                  </Button>
                </div>
              </div>
            ) : (
              /* --- VIEW 2: GIAO DIỆN CHỌN NHÂN VIÊN MỚI (SCROLL + SELECT) --- */
              <div className="page-fade-in">
                <div
                  style={{
                    marginBottom: "15px",
                    padding: "10px 15px",
                    borderRadius: "8px",
                    background: isFullSelection ? "#fff1f0" : "#f0f5ff",
                    border: `1px solid ${isFullSelection ? "#ffa39e" : "#adc6ff"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    strong
                    style={{ color: isFullSelection ? "#f5222d" : "#1d39c4" }}
                  >
                    <AlertOutlined /> Tình trạng: {selectedEmployeeIds.length} /{" "}
                    {availableSeats} slots khả dụng
                  </Text>
                  {isFullSelection && (
                    <Tag color="error">Đã đạt giới hạn bản quyền</Tag>
                  )}
                </div>

                <div
                  style={{
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Input
                    prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                    placeholder="Tìm nhân viên để cấp phát..."
                    allowClear
                    className="input-3d"
                    style={{ width: 400 }}
                    value={empSearchText}
                    onChange={(e) => setEmpSearchText(e.target.value)}
                  />
                  <Button
                    icon={<DownloadOutlined />}
                    className="btn-excel-download"
                    onClick={handleDownloadEmployees}
                    size="large"
                  >
                    <span style={{ fontWeight: 600 }}>TẢI EXCEL NHẬP DS</span>
                  </Button>

                  <Upload
                    beforeUpload={handleUploadAssignList}
                    accept=".xlsx"
                    showUploadList={false}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      className="btn-excel-upload"
                      size="large"
                    >
                      <span style={{ fontWeight: 600 }}>TẢI LIST LÊN</span>
                    </Button>
                  </Upload>
                </div>

                {/* VÙNG CUỘN VÔ TẬN */}
                <div
                  onScroll={handleScroll}
                  style={{
                    height: "400px",
                    overflowY: "auto",
                    border: "1px solid #f0f0f0",
                    borderRadius: "12px",
                    padding: "4px",
                  }}
                >
                  <Table
                    className="employee-table-styled"
                    rowSelection={{
                      type: "checkbox",
                      selectedRowKeys: selectedEmployeeIds,
                      onChange: (keys: React.Key[]) => {
                        // 1. Chuyển tất cả về String để so sánh chính xác tuyệt đối
                        const currentKeys = keys.map((k) => k.toString());

                        // 2. Cập nhật State
                        // Ant Design với 'preserveSelectedRowKeys' sẽ tự động quản lý việc
                        // giữ lại các key cũ không có trong danh sách hiển thị hiện tại.
                        setSelectedEmployeeIds(currentKeys);
                      },
                      preserveSelectedRowKeys: true, // CỰC KỲ QUAN TRỌNG
                      getCheckboxProps: (record) => ({
                        // Khi so sánh để disable cũng phải đồng bộ kiểu dữ liệu
                        disabled:
                          isFullSelection &&
                          !selectedEmployeeIds.includes(
                            record.employeeId?.toString(),
                          ),
                      }),
                    }}
                    rowKey={(record) => record.employeeId?.toString()}
                    dataSource={allEmployees.filter(
                      (item) =>
                        item.fullName
                          ?.toLowerCase()
                          .includes(empSearchText.toLowerCase()) ||
                        item.employeeId?.toString().includes(empSearchText),
                    )}
                    size="small"
                    pagination={false} // BẮT BUỘC TẮT để scroll hoạt động
                    columns={[
                      {
                        title: "Mã NV",
                        dataIndex: "employeeId",
                        render: (t, record) => {
                          const isDisabled =
                            isFullSelection &&
                            !selectedEmployeeIds.includes(record.employeeId);
                          return (
                            <Tag
                              color="geekblue"
                              style={{ opacity: isDisabled ? 0.5 : 1 }}
                            >
                              {t}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: "Họ và Tên",
                        dataIndex: "fullName",
                        render: (t, record) => {
                          const isDisabled =
                            isFullSelection &&
                            !selectedEmployeeIds.includes(record.employeeId);
                          return (
                            <Text
                              strong
                              style={{
                                color: isDisabled ? "#bfbfbf" : "inherit",
                              }}
                            >
                              {t}
                            </Text>
                          );
                        },
                      },
                      {
                        title: "Phòng ban",
                        dataIndex: "department",
                        render: (t) => <Text type="secondary">{t}</Text>,
                      },
                    ]}
                  />
                  {empLoading && (
                    <div style={{ textAlign: "center", padding: "10px" }}>
                      <Spin size="small" />
                    </div>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "25px",
                    display: "flex",
                    gap: "15px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    className="btn-cancel-3d"
                    icon={<HistoryOutlined />}
                    onClick={() => {
                      // 1. Chuyển về chế độ xem danh sách
                      setIsAssigning(false);

                      // 2. Reset search text để tránh việc filter làm mất dòng dữ liệu
                      setEmpSearchText("");

                      // 3. Gọi hàm fetch lại dữ liệu từ API (phải dùng đúng tên hàm fetch của bạn)
                      const licenseId = Number(
                        selectedItem?.id || selectedItem?.id,
                      );
                      if (licenseId) {
                        fetchEmployeesByLicense(licenseId, 1, true);
                      }
                    }}
                  >
                    QUAY LẠI
                  </Button>
                  <Button
                    type="primary"
                    icon={<VerifiedOutlined />}
                    className="btn-submit-3d"
                    disabled={selectedEmployeeIds.length === 0}
                    loading={assignLoading}
                    onClick={handleConfirmAssign}
                  >
                    XÁC NHẬN CẤP PHÁT ({selectedEmployeeIds.length})
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={isAccountModalOpen}
        onCancel={() => setIsAccountModalOpen(false)}
        footer={null}
        width={400}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div
            className="modal-top-decor"
            style={{ background: "linear-gradient(90deg, #6366f1, #a855f7)" }}
          ></div>
          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="main-icon">
                <KeyOutlined />
              </div>
            </div>
          </div>
          <div className="modal-body-3d" style={{ padding: "30px" }}>
            <div
              className="modal-title-group"
              style={{ textAlign: "center", marginBottom: "25px" }}
            >
              <span style={{ letterSpacing: "2px" }}>CREDENTIAL DETAILS</span>
              <h2 style={{ fontSize: "18px" }}>{selectedItem?.softwareName}</h2>
            </div>

            <div
              className="credential-box-3d"
              style={{
                background: "#f8fafc",
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <Text type="secondary" style={{ fontSize: "11px" }}>
                  USERNAME / EMAIL
                </Text>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "4px",
                  }}
                >
                  <Text strong>{selectedItem?.username || "N/A"}</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={(e) =>
                      handleCopyKey(e, selectedItem?.username || "")
                    }
                  />
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: "11px" }}>
                  PASSWORD
                </Text>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "4px",
                  }}
                >
                  <Text strong>
                    {visiblePasswords[selectedItem?.id!]
                      ? selectedItem?.password
                      : "••••••••••••"}
                  </Text>
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={
                        visiblePasswords[selectedItem?.id!] ? (
                          <ClockCircleOutlined />
                        ) : (
                          <KeyOutlined />
                        )
                      }
                      onClick={() =>
                        setVisiblePasswords((p) => ({
                          ...p,
                          [selectedItem?.id!]: !p[selectedItem?.id!],
                        }))
                      }
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={(e) =>
                        handleCopyKey(e, selectedItem?.password || "")
                      }
                    />
                  </Space>
                </div>
              </div>
            </div>

            <Button
              className="btn-submit-3d"
              style={{
                width: "100%",
                marginTop: "20px",
                background: "#6366f1",
              }}
              onClick={() => setIsAccountModalOpen(false)}
            >
              ĐÓNG THÔNG TIN
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={isImportModalOpen}
        onCancel={() => setIsImportModalOpen(false)}
        footer={null}
        width={450}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden // Thay destroyOnHidden bằng destroyOnClose để giải phóng RAM hoàn toàn khi đóng
      >
        <div className="modal-inner-3d">
          <div
            className="modal-top-decor"
            style={{ background: "var(--cyan-primary)" }}
          ></div>
          <div
            className="modal-body-3d"
            style={{ textAlign: "center", padding: "30px 20px" }}
          >
            <div className="modal-title-group" style={{ marginBottom: 25 }}>
              <span>DATA SYNCHRONIZATION</span>
              <h2>Nhập dữ liệu Excel</h2>
              <p
                style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "5px" }}
              >
                Hỗ trợ các cột: Tên, Key, Số lượng, Thuê bao, Hết hạn
              </p>
            </div>

            <Upload
              name="file"
              multiple={false}
              accept=".xlsx, .xls"
              showUploadList={false}
              beforeUpload={async (file) => {
                const formData = new FormData();
                formData.append("file", file);

                setUploading(true);
                try {
                  console.log("Uploading file:", formData);
                  // URL gọi đến API xử lý file Excel rút gọn
                  await axiosClient.post("/SoftwareLicense/import", formData, {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  });

                  message.success("Import dữ liệu thành công!");
                  setIsImportModalOpen(false);
                  fetchApiData();
                } catch (err: any) {
                  console.error("Import Error:", err);
                  message.error(
                    err.response?.data?.message ||
                      "Lỗi cấu trúc file hoặc kết nối",
                  );
                } finally {
                  setUploading(false);
                }
                return false; // Ngăn upload tự động của AntD
              }}
            >
              <div className="upload-zone-3d">
                <FileExcelOutlined
                  style={{
                    fontSize: 48,
                    color: "var(--cyan-primary)",
                    marginBottom: 15,
                  }}
                />
                <p>Kéo thả file .xlsx vào đây hoặc click để chọn</p>
                <Button
                  type="primary"
                  loading={uploading}
                  className="tag-3d-cyan-bold"
                  style={{ marginTop: 10 }}
                >
                  {uploading ? "ĐANG XỬ LÝ..." : "CHỌN FILE NGAY"}
                </Button>
              </div>
            </Upload>

            <Button
              onClick={() => setIsImportModalOpen(false)}
              style={{ marginTop: 12 }}
              className="btn-cancel-3d"
              disabled={uploading}
            >
              Đóng cửa sổ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SoftwareLicenseList;
