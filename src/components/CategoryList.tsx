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
  Select,
  Row,
  Col,
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
  AppstoreOutlined,
  BookOutlined,
  DesktopOutlined,
  CloudServerOutlined,
  ContainerOutlined,
  LayoutOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

import { categoryService, type Category } from "../services/useCategoryService";
import "../CSS/GlobalStyle.css";
const { Title, Text } = Typography;
const { Option } = Select;

const CategoryList: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(10); // Mặc định là 10
  const [globalLoading, setGlobalLoading] = useState(false);
  const loadData = async () => {
    try {
      setLoading(true);

      const res = await categoryService.getAll();

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error("Lỗi đồng bộ hệ thống danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    setGlobalLoading(true); // Khóa toàn màn hình
    try {
      if (selectedCategory?.id) {
        await categoryService.update(selectedCategory.id, values);

        message.success("Cập nhật danh mục thành công");
      } else {
        await categoryService.create(values);

        message.success("Khởi tạo danh mục mới thành công");
      }

      setIsModalOpen(false);

      loadData();
    } catch (err) {
      message.error("Thao tác thất bại");
    } finally {
      setSubmitting(false);
      setGlobalLoading(false); // Mở khóa
    }
  };

  const openModal = (category: Category | null = null) => {
    setSelectedCategory(category);

    if (category) form.setFieldsValue(category);
    else form.resetFields();

    setIsModalOpen(true);
  };

  const stats = {
    total: data.length,
    hardware: data.filter((i) => i.type === "Hardware").length,
    software: data.filter((i) => i.type === "Software").length,
    another: data.filter((i) => !["Hardware", "Software"].includes(i.type))
      .length,
  };
  const handleDelete = async (id: number | string) => {
    try {
      await categoryService.delete(id);
      message.success("Xóa danh mục thành công!"); // Thông báo thành công
      await loadData(); // Tải lại dữ liệu mới
    } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      message.error("Xóa danh mục thất bại. Vui lòng thử lại!"); // Thông báo thất bại
    } finally {

    }
  };
  const columns = [
    {
      title: "DANH MỤC TÀI SẢN",
      dataIndex: "name",
      key: "name",

      render: (text: string) => (
        <div className="asset-info-cell-3d">
          <div className="icon-box-3d">
            <BookOutlined />
          </div>

          <div className="text-group">
            <Text strong className="name-3d">
              {text}
            </Text>

            {/* <div className="sub-path">System / Asset / Class</div> */}
          </div>
        </div>
      ),
    },

    {
      title: "PHÂN LOẠI",
      dataIndex: "type",
      key: "type",

      render: (type: string) => {
        const config: any = {
          Hardware: {
            color: "#10b981",
            icon: <DesktopOutlined />,
            label: "Phần cứng",
          },

          Software: {
            color: "#3b82f6",
            icon: <CloudServerOutlined />,
            label: "Phần mềm",
          },

          Consumable: {
            color: "#f59e0b",
            icon: <ContainerOutlined />,
            label: "Tiêu hao / Khác",
          },
        }[type] || { color: "#8b5cf6", icon: <LayoutOutlined />, label: type };

        return (
          <div className="type-pill-3d">
            <span className="dot" style={{ background: config.color }}></span>
            {config.icon}
            <span className="label" style={{ marginLeft: "8px" }}>
              {config.label}
            </span>
          </div>
        );
      },
    },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right" as const,
      render: (record: Category) => (
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
            title="Xác nhận xóa?"
            onConfirm={() => handleDelete(record.id!)}
          >
            {globalLoading && (
              <div className="global-loading-overlay">
                <Spin
                  size="large"
                  tip="Đang đồng bộ dữ liệu danh mục thiết bị..."
                />
              </div>
            )}
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
                <ThunderboltOutlined /> SYSTEM CORE
              </div>

              <Title level={1} className="banner-title">
                Category Architecture
              </Title>

              <Text className="banner-subtitle">
                Cấu trúc phân loại tài sản hệ thống
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
              TẠO MỚI
            </Button>
          </div>

          <div className="bento-card stat-card hardware">
            <Statistic
              title="Phần cứng"
              value={stats.hardware}
              prefix={<DesktopOutlined style={{ color: "#06b6d4" }} />}
            />

            <div
              className="stat-progress"
              style={{ background: "#06b6d4" }}
            ></div>
          </div>

          <div className="bento-card stat-card software">
            <Statistic
              title="Phần mềm"
              value={stats.software}
              prefix={<CloudServerOutlined style={{ color: "#f59e0b" }} />}
            />

            <div
              className="stat-progress"
              style={{ background: "#f59e0b" }}
            ></div>
          </div>

          <div className="bento-card stat-card another">
            <Statistic
              title="Khác"
              value={stats.another}
              prefix={<AppstoreOutlined style={{ color: "#8b5cf6" }} />}
            />

            <div
              className="stat-progress"
              style={{ background: "#8b5cf6" }}
            ></div>
          </div>
        </div>

        {/* TABLE 3D PERSPECTIVE */}

        <div className="table-perspective-container">
          <Card className="glass-table-card-3d" variant="borderless">
            <div className="table-header-3d">
              <div className="search-engine-3d">
                <SearchOutlined />

                <input
                  placeholder="Tìm kiếm danh mục nhanh..."
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* <div className="sync-status">

                <span className="pulse-dot"></span>

                LIVE SYNC ACTIVE

              </div> */}
            </div>

            <Table
              columns={columns}
              dataSource={data.filter(
                (i) =>
                  i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                  i.type?.toLowerCase().includes(searchText.toLowerCase()),
              )}
              pagination={{
                current: undefined, // Để Antd tự quản lý trang hiện tại hoặc dùng state nếu cần
                pageSize: pageSize, // Sử dụng state pageSize
                pageSizeOptions: ["10", "20", "50", "100"], // Các lựa chọn cho người dùng
                showSizeChanger: true, // Hiển thị dropdown chọn số lượng dòng

                // Hàm này chạy khi người dùng đổi trang hoặc đổi pageSize
                onChange: (_, size) => {
                  setPageSize(size);
                },

                showTotal: (total) => (
                  <Text strong style={{ color: "#64748b" }}>
                    Tổng cộng {total} bản ghi
                  </Text>
                ),

                // Làm đẹp giao diện phân trang cho hợp với style 3D của bạn
                placement: "bottomRight" as any,
              }}
              loading={loading}
              rowKey="id"
              className="custom-table-3d"
            />
          </Card>
        </div>
      </div>

      {/* MODAL 3D SUPREME */}

      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        centered
        className="modal-3d-supreme"
        closable={false}
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>

          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="main-icon">
                {selectedCategory ? <EditOutlined /> : <PlusOutlined />}
              </div>

              <div className="particle p1"></div>

              <div className="particle p2"></div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <Title level={2} style={{ margin: 0 }}>
                {selectedCategory ? "Cập Nhật" : "Khởi Tạo"}
              </Title>

              <span>DATA ARCHITECTURE CONFIGURATION</span>
            </div>

            <Form form={form} layout="vertical" onFinish={handleFinish}>
              <Form.Item
                name="name"
                label="TÊN DANH MỤC"
                rules={[{ required: true }]}
              >
                <Input
                  className="input-3d"
                  placeholder="Nhập tên định dạng chuẩn..."
                />
              </Form.Item>

              <Row gutter={20}>
                <Col span={14}>
                  <Form.Item
                    name="type"
                    label="LOẠI TÀI SẢN"
                    rules={[{ required: true }]}
                  >
                    <Select className="select-3d">
                      <Option value="Hardware">Thiết bị phần cứng</Option>
                      {/* <Option value="Software">Phần mềm</Option> */}
                      <Option value="Consumable">Tiêu hao / Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label="GHI CHÚ KỸ THUẬT">
                <Input.TextArea
                  rows={3}
                  className="input-3d"
                  placeholder="Nhập mô tả hệ thống..."
                />
              </Form.Item>

              <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-cancel-3d"
                  style={{ flex: 1 }}
                >
                  HỦY
                </Button>
                {globalLoading && (
                  <div className="global-loading-overlay">
                    <Spin size="large" tip="Đang tạo mới danh mục..." />
                  </div>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  className="btn-submit-3d"
                  style={{ flex: 2 }}
                >
                  XÁC NHẬN LƯU <ThunderboltOutlined />
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryList;
