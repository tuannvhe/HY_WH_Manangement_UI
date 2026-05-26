import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Typography,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TruckOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { vendorService, type Vendor } from "../services/useVendorService";
import "../CSS/GlobalStyle.css";

const { Title, Text } = Typography;

const VendorList: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterText, setFilterText] = useState("");
  const [pageSize, setPageSize] = useState(10); // Mặc định là 10

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getAll();
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error("Lỗi đồng bộ dữ liệu đối tác");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (selectedVendor?.id) {
        await vendorService.update(selectedVendor.id, values);
        message.success("Cập nhật đối tác thành công");
      } else {
        await vendorService.create(values);
        message.success("Khởi tạo đối tác mới thành công");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      message.error("Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = () => setFilterText(searchText);

  const openModal = (vendor: Vendor | null = null) => {
    setSelectedVendor(vendor);
    if (vendor) form.setFieldsValue(vendor);
    else form.resetFields();
    setIsModalOpen(true);
  };

  const stats = {
    total: data.length,
    active: data.length,
    verified: data.filter((i) => i.contact).length,
    new: 2,
  };

  const columns = [
    {
      title: "ĐỐI TÁC CUNG ỨNG",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div className="asset-info-cell-3d">
          <div className="icon-box-3d">
            <TruckOutlined />
          </div>
          <div className="text-group">
            <div className="name-3d" style={{ fontWeight: 700 }}>
              {text}
            </div>
            <div className="sub-path">Authorized Vendor</div>
          </div>
        </div>
      ),
    },
    {
      title: "ĐẠI DIỆN",
      dataIndex: "contact",
      key: "contact",
      render: (contact: string) => (
        <div className="type-pill-3d">
          <div className="dot" style={{ background: "#10b981" }}></div>
          <UserOutlined /> {contact?.toUpperCase() || "N/A"}
        </div>
      ),
    },
    {
      title: "LIÊN HỆ & ĐỊA CHỈ",
      key: "contactInfo",
      render: (_: any, record: Vendor) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PhoneOutlined style={{ color: "#10b981", fontSize: "12px" }} />
            <Text strong style={{ color: "#1e293b", fontSize: "13px" }}>
              {record.phone || "N/A"}
            </Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <EnvironmentOutlined
              style={{ color: "#94a3b8", fontSize: "12px" }}
            />
            <Text
              type="secondary"
              style={{ fontSize: "12px" }}
              ellipsis={{ tooltip: record.address }}
            >
              {record.address || "Chưa cập nhật"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right" as const,
      render: (record: Vendor) => (
        <Space size="middle">
          <Button
            className="btn-3d edit"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Ngừng hợp tác?"
            onConfirm={() => vendorService.delete(record.id!).then(loadData)}
          >
            <Button
              className="btn-3d delete"
              danger
              icon={<DeleteOutlined />}
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
                <ThunderboltOutlined /> SUPPLY CHAIN
              </div>
              <Title level={1} className="banner-title">
                Vendor Network
              </Title>
              <Text className="banner-subtitle">
                Quản lý mạng lưới đối tác cung ứng
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              className="btn-submit-3d"
              style={{ width: "220px" }}
            >
              THÊM NHÀ CUNG CẤP
            </Button>
          </div>

          <div className="bento-card stat-card total">
            <Statistic
              title="TỔNG SỐ"
              value={stats.total}
              prefix={<GlobalOutlined style={{ color: "#10b981" }} />}
            />
            <div
              className="stat-progress"
              style={{ background: "#10b981" }}
            ></div>
          </div>

          <div className="bento-card stat-card hardware">
            <Statistic
              title="ĐANG HOẠT ĐỘNG"
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: "#06b6d4" }} />}
            />
            <div
              className="stat-progress"
              style={{ background: "#06b6d4" }}
            ></div>
          </div>

          {/* <div className="bento-card stat-card software">
            <Statistic title="ĐÃ XÁC THỰC" value={stats.verified} prefix={<SafetyCertificateOutlined style={{ color: '#f59e0b' }} />} />
            <div className="stat-progress" style={{ background: '#f59e0b' }}></div>
          </div> */}
        </div>

        {/* PERSPECTIVE TABLE */}
        <div className="table-perspective-container">
          <div className="glass-table-card-3d">
            <div className="table-header-3d">
              <div className="search-engine-3d">
                <SearchOutlined style={{ color: "#94a3b8" }} />
                <input
                  placeholder="Tìm kiếm tên đối tác..."
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
              {/* <div className="sync-status">
                <div className="pulse-dot"></div>
                SUPPLY CHAIN DATABASE LINKED
              </div> */}
            </div>

            <Table
              columns={columns}
              dataSource={data.filter((i) =>
                i.name?.toLowerCase().includes(filterText.toLowerCase()),
              )}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                showQuickJumper: false,
                onChange: (_, size) => {
                  setPageSize(size);
                },
                showTotal: (total) => (
                  <Text strong style={{ color: "#64748b" }}>
                    Tổng cộng {total} bản ghi
                  </Text>
                ),
              }}
              loading={loading}
              rowKey="id"
              className="custom-table-3d"
            />
          </div>
        </div>
      </div>

      {/* MODAL 3D SUPREME */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={650}
        centered
        closable={false}
        className="modal-3d-supreme"
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div
            className="modal-top-decor"
            style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }}
          ></div>

          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div
                className="particle p2"
                style={{ background: "#06b6d4" }}
              ></div>
              <div className="main-icon">
                <TruckOutlined />
              </div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>PARTNER REGISTRATION</span>
              <h2>
                {selectedVendor
                  ? "Cập nhật nhà cung cấp"
                  : "Thêm nhà cung cấp mới"}
              </h2>
            </div>

            <Form form={form} layout="vertical" onFinish={handleFinish}>
              <Form.Item
                name="name"
                label="Tên nhà cung cấp"
                rules={[
                  { required: true, message: "Vui lòng nhập tên nhà cung cấp" },
                ]}
              >
                <Input
                  className="input-3d"
                  placeholder="Ví dụ: Công ty TNHH VinaTech"
                />
              </Form.Item>

              <Row gutter={20}>
                <Col span={12}>
                  <Form.Item name="contact" label="Người đại diện">
                    <Input
                      className="input-3d"
                      prefix={<UserOutlined />}
                      placeholder="Họ và tên..."
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input
                      className="input-3d"
                      prefix={<PhoneOutlined />}
                      placeholder="090..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="address" label="Địa chỉ trụ sở">
                <Input.TextArea
                  rows={3}
                  className="input-3d"
                  placeholder="Số nhà, đường, quận/huyện..."
                />
              </Form.Item>

              <div
                style={{
                  marginTop: "40px",
                  display: "flex",
                  gap: "15px",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  className="btn-cancel-3d"
                  onClick={() => setIsModalOpen(false)}
                  style={{ width: "140px" }}
                >
                  HỦY BỎ
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  className="btn-submit-3d"
                  style={{
                    width: "220px",
                    background:
                      "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)",
                  }}
                >
                  LƯU DỮ LIỆU
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorList;
