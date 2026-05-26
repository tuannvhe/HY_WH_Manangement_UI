import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  Row,
  Col,
  Divider,
  message,
  Tag,
  Typography,
  Table,
  Input,
  Avatar,
  Space,
  Spin,
} from "antd";
import {
  UserAddOutlined,
  SearchOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import axiosClient from "../axiosClient";
import { generateQrPdf } from "../utils/generateQrPdf";
import debounce from "lodash/debounce";
import { locationService, type Location } from "../services/useLocationService";

const { Title, Text } = Typography;
const { Option } = Select;

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AssignMultipleModal: React.FC<Props> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const [globalLoading, setGlobalLoading] = useState(false);

  const [form] = Form.useForm();
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [internalEmployees, setInternalEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [empPage, setEmpPage] = useState(1);
  const [hasMoreEmp, setHasMoreEmp] = useState(true);
  const [currentSearchEmp, setCurrentSearchEmp] = useState("");

  // 1. FETCH DATA FUNCTIONS
  const fetchLocations = async () => {
    try {
      const res = await locationService.getAll();
      setLocations(res.data as Location[]);
    } catch (error) {
      console.error("Lỗi tải vị trí:", error);
    }
  };

  const fetchEmployees = async (search = "", page = 1, isAppend = false) => {
    if (loadingEmployees) return;
    setLoadingEmployees(true);
    try {
      const res = await axiosClient.get("Employees/lookup-paged", {
        params: {
          searchTerm: search,
          pageNumber: page,
          pageSize: 20,
        },
      });
      const newData = res.data;
      setInternalEmployees((prev) =>
        isAppend ? [...prev, ...newData] : newData,
      );
      setHasMoreEmp(newData.length === 20);
      setEmpPage(page);
    } catch (error) {
      message.error("Không thể tải danh sách nhân viên.");
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Thêm tham số pSize (optional)
  const fetchAvailableAssets = async (
    page: number,
    search: string,
    pSize?: number,
  ) => {
    setLoadingAssets(true);
    try {
      // Ưu tiên dùng pSize mới truyền vào, nếu không có thì dùng trong state
      const currentPageSize = pSize || pagination.pageSize;

      const res = await axiosClient.get("HardwareAssets/available", {
        params: {
          pageNumber: page,
          pageSize: currentPageSize,
          searchTerm: search,
        },
      });

      const { items, totalCount } = res.data;
      setAvailableAssets(items);

      // Cập nhật state đồng bộ
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: currentPageSize,
        total: totalCount,
      }));
    } catch (error) {
      message.error("Không thể tải danh sách thiết bị.");
    } finally {
      setLoadingAssets(false);
    }
  };

  // 2. HANDLERS
  useEffect(() => {
    if (open) {
      setSelectedRowKeys([]);
      setSearchTerm("");
      setCurrentSearchEmp("");
      fetchEmployees("", 1, false);
      fetchAvailableAssets(1, "");
      fetchLocations();
    } else {
      form.resetFields();
    }
  }, [open, form]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, offsetHeight, scrollHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop - offsetHeight < 10 &&
      hasMoreEmp &&
      !loadingEmployees
    ) {
      fetchEmployees(currentSearchEmp, empPage + 1, true);
    }
  };

  const debounceSearchEmp = useCallback(
    debounce((nextValue: string) => {
      setCurrentSearchEmp(nextValue);
      fetchEmployees(nextValue, 1, false);
    }, 500),
    [],
  );

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debounceSearch(value);
  };

  const debounceSearch = useCallback(
    debounce((nextValue: string) => {
      fetchAvailableAssets(1, nextValue);
    }, 500),
    [],
  );

  const downloadHandoverFile = async (handoverId: number) => {
    try {
      const response = await axiosClient.get(`/Handover/export/${handoverId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BienBan_${handoverId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error("Lỗi khi tải file.");
    }
  };

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    setGlobalLoading(true); //
    try {
      const selectedEmp = internalEmployees.find(
        (e) => e.employeeId === values.employeeId,
      );
      const payload = {
        employeeId: values.employeeId,
        location: values.location, // String locationName
        assetIds: selectedRowKeys,
        condition: "Mới",
        employeeName: selectedEmp?.fullName,
        receiverDept: selectedEmp?.department,
      };

      const res = await axiosClient.post(
        "Assignment/assign-multiple-assets",
        payload,
      );
      message.success(
        `Đã bàn giao thành công ${selectedRowKeys.length} thiết bị.`,
      );

      if (res.data?.handoverId) {
        message.loading("Đang khởi tạo và tải biên bản...", 2);
        await downloadHandoverFile(res.data.handoverId);

        // Tự động tạo PDF chứa QR và thông tin thiết bị
        try {
          const selectedAssets = availableAssets.filter((a) =>
            selectedRowKeys.includes(a.id),
          );
          await generateQrPdf(
            selectedAssets,
            `QR_BienBan_${res.data.handoverId}.pdf`,
            {
              recipientName: selectedEmp?.fullName,
              department: selectedEmp?.department,
              code: selectedEmp?.employeeId,
              handoverId: res.data.handoverId,
            },
          );
        } catch (err) {
          console.error("Lỗi khi tạo PDF QR:", err);
        }
      }
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data || "Lỗi khi bàn giao.");
    } finally {
      setSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const columns = [
    {
      title: "THIẾT BỊ",
      dataIndex: "assetTag", // Bạn có thể đổi thành key: 'combined' nếu render dùng nhiều field
      key: "assetTag",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text
            strong
            style={{
              color: "#2d3436", // Màu đen xám sang trọng thay vì đen tuyền
              fontSize: "14px",
              letterSpacing: "0.5px",
            }}
          >
            {record.modelName}
          </Text>
        </div>
      ),
    },
    {
      title: "SỐ SERIAL",
      dataIndex: "serial",
      key: "serial",
      render: (serial: string) => <Tag>{serial}</Tag>,
    },
    {
      title: "THÔNG SỐ",
      dataIndex: "specs",
      key: "specs",
      ellipsis: true,
      render: (specs: string) => (
        <Text type="secondary" style={{ fontSize: "12px" }}>
          {specs || "N/A"}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
      centered
      className="modal-3d-supreme"
      closable={false}
      destroyOnHidden
      forceRender
    >
      <div className="modal-inner-3d">
        <div className="modal-top-decor"></div>

        {/* Cấu trúc cho Icon bay 3D */}
        <div className="modal-floating-icon-container">
          <div className="icon-orbit">
            <div className="particle p1"></div>
            <div className="particle p2"></div>
            <div className="main-icon">{<PlusOutlined />}</div>
          </div>
        </div>
        <div className="modal-body-3d" style={{ padding: "20px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <Title level={2} style={{ margin: 0, letterSpacing: "1px" }}>
              BÀN GIAO TẬP TRUNG
            </Title>
            <Text type="secondary">
              Cấp phát thiết bị hàng loạt cho nhân viên Vinatech
            </Text>
          </div>

          <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Row gutter={20}>
              {/* COMBOBOX NHÂN VIÊN */}
              <Col span={12}>
                <Form.Item
                  name="employeeId"
                  label={
                    <Text strong>
                      <UserAddOutlined /> NHÂN VIÊN TIẾP NHẬN
                    </Text>
                  }
                  rules={[
                    { required: true, message: "Vui lòng chọn nhân viên" },
                  ]}
                >
                  <Select
                    className="select-3d"
                    showSearch
                    loading={loadingEmployees}
                    placeholder="Tìm theo tên hoặc mã..."
                    size="large"
                    filterOption={false}
                    onSearch={debounceSearchEmp}
                    onPopupScroll={handleScroll}
                    allowClear
                  >
                    {internalEmployees.map((emp) => (
                      <Option key={emp.employeeId} value={emp.employeeId}>
                        <Space>
                          <Avatar
                            size="small"
                            icon={<UserAddOutlined />}
                            style={{ background: "#0891b2" }}
                          />
                          <Text strong>{emp.fullName}</Text>
                          <Tag color="blue">{emp.employeeId}</Tag>
                          <Tag color="red">{emp.department}</Tag>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* COMBOBOX VỊ TRÍ */}
              <Col span={12}>
                <Form.Item
                  name="location"
                  label={
                    <Text strong>
                      <EnvironmentOutlined /> VỊ TRÍ BÀN GIAO
                    </Text>
                  }
                  rules={[{ required: true, message: "Vui lòng chọn vị trí" }]}
                >
                  <Select
                    className="select-3d"
                    showSearch
                    placeholder="Chọn phòng ban / Vị trí thực tế..."
                    size="large"
                    allowClear
                  >
                    {locations.map((loc: Location) => (
                      <Option key={loc.id} value={loc.locationName}>
                        <EnvironmentOutlined
                          style={{ marginRight: 8, color: "#0891b2" }}
                        />
                        {loc.locationName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div
              style={{
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space>
                <DatabaseOutlined />
                <Text strong>DANH SÁCH THIẾT BỊ</Text>
                <Tag color="cyan">ĐÃ CHỌN: {selectedRowKeys.length}</Tag>
              </Space>
              <Input
                placeholder="Tìm nhanh Tag, Serial..."
                prefix={<SearchOutlined />}
                style={{ width: 300, borderRadius: 8 }}
                value={searchTerm}
                onChange={onSearchChange}
              />
            </div>

            <Table
              rowSelection={{
                type: "checkbox",
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
                preserveSelectedRowKeys: true,
              }}
              columns={columns}
              dataSource={availableAssets}
              rowKey="id"
              className=""
              loading={loadingAssets}
              size="middle"
              pagination={{
                ...pagination,
                onChange: (page, pageSize) => {
                  // 1. Cập nhật state pagination để pageSize mới được lưu lại
                  setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                  }));

                  // 2. Gọi API với các giá trị mới
                  fetchAvailableAssets(page, searchTerm, pageSize);
                },
                showTotal: (total) => `Tổng cộng ${total} thiết bị`,
              }}
            />

            <Divider />

            <div
              style={{ display: "flex", gap: 15, justifyContent: "flex-end" }}
            >
              <Button
                className="btn-cancel-3d"
                size="large"
                onClick={onCancel}
                disabled={submitting}
              >
                HỦY
              </Button>
              {globalLoading && (
                <div className="global-loading-overlay">
                  <Spin
                    size="large"
                    tip="Đang lưu dữ liệu bàn giao và tải xuống biên bản & QR Code..."
                  />
                </div>
              )}
              <Button
                type="primary"
                size="large"
                //icon={<ArrowRightOutlined />}
                onClick={() => form.submit()}
                loading={submitting}
                disabled={selectedRowKeys.length === 0}
                style={{ minWidth: 200 }}
                className="btn-submit-3d"
              >
                XÁC NHẬN BÀN GIAO
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default AssignMultipleModal;
