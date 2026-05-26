import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Card,
  Typography,
  Tooltip,
  Statistic,
  Popconfirm,
  message,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  DeploymentUnitOutlined,
  HomeOutlined,
  FilterOutlined,
} from "@ant-design/icons";
// Giả định bạn đã tạo service này tương tự categoryService
import { locationService, type Location } from "../services/useLocationService";
import "../CSS/GlobalStyle.css";

const { Title, Text } = Typography;

const LocationList: React.FC = () => {
  const [globalLoading, setGlobalLoading] = useState(false);

  const [form] = Form.useForm();
  const [data, setData] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterText, setFilterText] = useState("");

  const [pageSize, setPageSize] = useState(10); // Mặc định là 10

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await locationService.getAll();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error("Lỗi đồng bộ hệ thống vị trí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    setGlobalLoading(true);
    try {
      console.log("Id:", selectedLocation?.id); // Kiểm tra dữ liệu form trước khi gửi
      console.log("Form values:", values); // Kiểm tra dữ liệu form trước khi gửi
      if (selectedLocation?.id) {
        await locationService.update(selectedLocation.id, values);
        message.success("Cập nhật vị trí thành công");
      } else {
        await locationService.create(values);
        message.success("Khởi tạo vị trí mới thành công");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      message.error("Thao tác thất bại");
    } finally {
      setSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleSearch = () => setFilterText(searchText);

  const openModal = (location: Location | null = null) => {
    setSelectedLocation(location);
    if (location) form.setFieldsValue(location);
    else form.resetFields();
    setIsModalOpen(true);
  };

  // Thống kê nhanh cho các khu vực chính của VinaTech
  const stats = {
    total: data.length,
    office: data.filter(
      (i) =>
        i.locationName?.toLowerCase().includes("office") ||
        i.locationName?.toLowerCase().includes("phòng"),
    ).length,
    factory: data.filter(
      (i) =>
        i.locationName?.toLowerCase().includes("factory") ||
        i.locationName?.toLowerCase().includes("sản xuất"),
    ).length,
  };

  const columns = [
    {
      title: "VỊ TRÍ / PHÒNG BAN",
      dataIndex: "locationName",
      key: "locationName",
      render: (text: string) => (
        <div className="asset-info-cell-3d">
          <div className="icon-box-3d">
            <EnvironmentOutlined />
          </div>
          <div className="text-group">
            <Text strong className="name-3d">
              {text}
            </Text>
          </div>
        </div>
      ),
    },
    // {
    //     title: 'MÃ ĐỊNH DANH',
    //     dataIndex: 'id',
    //     key: 'id',
    //     width: 150,
    //     render: (id: number) => (
    //         <div className="type-pill-3d">
    //             <span className="dot" style={{ background: '#3b82f6' }}></span>
    //             <Text code>LOC-{id.toString().padStart(3, '0')}</Text>
    //         </div>
    //     )
    // },
    // {
    //     title: 'TRẠNG THÁI',
    //     key: 'status',
    //     align: 'center' as const,
    //     render: () => (
    //         <div className="depreciation-tag-3d">
    //             <GlobalOutlined />
    //             <span className="value" style={{ fontSize: '12px' }}>ACTIVE</span>
    //         </div>
    //     ),
    // },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right" as const,
      render: (record: Location) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              className="btn-3d"
              style={{ color: "#3b82f6" }}
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa vị trí này?"
            onConfirm={() =>
              locationService
                .delete(record.id!)
                .then(() => {
                  message.success("Xóa vị trí thành công!"); // Hiện thông báo thành công
                  loadData(); // Tải lại dữ liệu bảng
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Xóa vị trí thất bại!"); // Hiện thông báo nếu có lỗi xảy ra
                })
            }
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              className="btn-3d delete"
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-page-container">
      <div className="page-fade-in">
        {/* BENTO HEADER */}
        <div className="bento-header-wrapper">
          <div className="bento-card welcome-banner">
            <div className="banner-content">
              <div className="banner-badge">
                <DeploymentUnitOutlined /> NETWORK TOPOLOGY
              </div>
              <Title level={1} className="banner-title">
                Location Map
              </Title>
              <Text className="banner-subtitle">
                Quản lý sơ đồ vị trí & phòng ban chi nhánh
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              className="btn-submit-3d"
              style={{ width: "200px" }}
            >
              THÊM VỊ TRÍ
            </Button>
          </div>

          <div className="bento-card stat-card hardware">
            <Statistic
              title="Tổng vị trí"
              value={stats.total}
              prefix={<HomeOutlined style={{ color: "#06b6d4" }} />}
            />
            <div
              className="stat-progress"
              style={{ background: "#06b6d4" }}
            ></div>
          </div>

          {/* <div className="bento-card stat-card software">
                        <Statistic title="Khối văn phòng" value={stats.office} prefix={<DeploymentUnitOutlined style={{ color: '#f59e0b' }} />} />
                        <div className="stat-progress" style={{ background: '#f59e0b' }}></div>
                    </div>

                    <div className="bento-card stat-card another">
                        <Statistic title="Khối sản xuất" value={stats.factory} prefix={<GlobalOutlined style={{ color: '#8b5cf6' }} />} />
                        <div className="stat-progress" style={{ background: '#8b5cf6' }}></div>
                    </div> */}
        </div>

        {/* TABLE AREA */}
        <div className="table-perspective-container">
          <Card className="glass-table-card-3d" variant="borderless">
            <div className="table-header-3d">
              <div className="search-engine-3d">
                <SearchOutlined />
                <input
                  placeholder="Tìm kiếm vị trí, phòng ban..."
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
              >
                LỌC KẾT QUẢ
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={data.filter((i) =>
                i.locationName
                  ?.toLowerCase()
                  .includes(filterText.toLowerCase()),
              )}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                //pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (_, size) => setPageSize(size),
                showTotal: (total) => (
                  <Text strong style={{ color: "#64748b" }}>
                    Tổng số {total} điểm vị trí
                  </Text>
                ),
              }}
              loading={loading}
              rowKey="id"
              className="custom-table-3d"
            />
          </Card>
        </div>
      </div>

      {/* MODAL SUPREME */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div
            className="modal-top-decor"
            style={{ background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }}
          ></div>
          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="main-icon">
                {selectedLocation ? <EditOutlined /> : <PlusOutlined />}
              </div>
              {/* <div className="particle p1"></div> */}
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <Title level={2} style={{ margin: 0 }}>
                {selectedLocation ? "Cập Nhật" : "Khởi Tạo"}
              </Title>
              <span>INFRASTRUCTURE NODE CONFIG</span>
            </div>

            <Form form={form} layout="vertical" onFinish={handleFinish}>
              <Form.Item
                name="locationName"
                label="TÊN VỊ TRÍ / PHÒNG BAN"
                rules={[
                  { required: true, message: "Vui lòng nhập tên vị trí" },
                ]}
              >
                <Input
                  className="input-3d"
                  placeholder="VD: Production-Factory 1..."
                />
              </Form.Item>

              <Text
                type="secondary"
                style={{
                  fontSize: "12px",
                  display: "block",
                  marginBottom: "20px",
                }}
              >
                * Lưu ý: Tên vị trí sẽ được hiển thị trên các biên bản bàn giao
                thiết bị.
              </Text>

              <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-cancel-3d"
                  style={{ flex: 1 }}
                >
                  ĐÓNG
                </Button>
                {globalLoading && (
                  <div className="global-loading-overlay">
                    <Spin size="large" tip="Đang lưu vị trí / phòng ban..." />
                  </div>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  className="btn-submit-3d"
                  style={{ flex: 2 }}
                >
                  LƯU VỊ TRÍ
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LocationList;
