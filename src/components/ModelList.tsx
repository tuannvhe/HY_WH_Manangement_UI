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
  Tooltip,
  Select,
  Avatar,
  Row,
  Col,
  Statistic,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PictureOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  BlockOutlined,
  SettingOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import "../CSS/GlobalStyle.css";

// Import Services
import { modelService, type ModelDto } from "../services/useModelService";
import { categoryService, type Category } from "../services/useCategoryService";
import { vendorService, type Vendor } from "../services/useVendorService";

const { Title, Text } = Typography;
const { Option } = Select;

const ModelList: React.FC = () => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [form] = Form.useForm();
  const [data, setData] = useState<ModelDto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [_, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterText, setFilterText] = useState("");
  const [pageSize, setPageSize] = useState(10); // Mặc định là 10

  const loadData = async () => {
    try {
      setLoading(true);
      const [modelRes, catRes, venRes] = await Promise.all([
        modelService.getAll(),
        categoryService.getAll(),
        vendorService.getAll(),
      ]);
      setData(Array.isArray(modelRes.data) ? modelRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setVendors(Array.isArray(venRes.data) ? venRes.data : []);
    } catch (err) {
      message.error("Lỗi đồng bộ hệ thống cấu hình");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = {
    totalModels: data.length,
    totalBrands: new Set(data.map((i) => i.manufacturer)).size,
    categories: categories.length,
  };

  const handleFinish = async (values: any) => {
  setSubmitting(true);
  setGlobalLoading(true);
  try {
    if (selectedModel?.id) {
      await modelService.update(selectedModel.id, values);
      message.success("Cập nhật phân loại thành công");
    } else {
      await modelService.create(values);
      message.success("Khởi tạo phân loại mới thành công");
    }
    setIsModalOpen(false);
    loadData();
  } catch (err: any) {
    // Lấy message từ response
    const errorMessage = err?.response?.data?.message 
      || err?.message 
      || "Thao tác thất bại";
    
    message.error(errorMessage);
  } finally {
    setSubmitting(false);
    setGlobalLoading(false);
  }
};

  const handleSearch = () => setFilterText(searchText);

  const openModal = (model: ModelDto | null = null) => {
    setSelectedModel(model);
    if (model) form.setFieldsValue(model);
    else form.resetFields();
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: "THIẾT KẾ",
      key: "model_info",
      width: 500,
      render: (record: ModelDto) => (
        <div className="asset-info-cell-3d">
          <div className="icon-box-3d">
            <Avatar
              shape="square"
              size={34}
              src={record.imageURL}
              icon={<PictureOutlined />}
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            />
          </div>
          <div className="text-group">
            <div
              className="name-3d"
              style={{ fontWeight: 700, fontSize: "13px", color: "#157fe9" }}
            >
              {record.modelName}
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "THÔNG SỐ KỸ THUẬT",
      dataIndex: "specs",
      render: (specs: string) => (
        <Tooltip title={specs}>
          <div className="depreciation-tag-3d">
            <SettingOutlined />
            <span
              className="value"
              style={{
                maxWidth: "180px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginLeft: "5px",
              }}
            >
              {specs || "N/A"}
            </span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right" as const,
      render: (record: ModelDto) => (
        <Space size="middle">
          <Button
            className="btn-3d"
            style={{ color: "#3b82f6" }}
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Xóa Model này?"
            onConfirm={() =>
              modelService
                .delete(record.id!)
                .then(() => {
                  message.success("Xóa phân loại thành công!"); // Hiện thông báo thành công
                  loadData(); // Tải lại dữ liệu bảng
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Xóa phân loại thất bại!"); // Hiện thông báo nếu có lỗi xảy ra
                })
            }
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
                <ThunderboltOutlined /> CONFIGURATION
              </div>
              <Title level={1} className="banner-title">
                Model Library
              </Title>
              <Text className="banner-subtitle">
                Quản lý định danh và thông số thiết bị
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
              THÊM THIẾT BỊ MỚI
            </Button>
          </div>

          <div className="bento-card stat-card total">
            <Statistic
              title="SỐ THIẾT BỊ"
              value={stats.totalModels}
              prefix={<AppstoreOutlined style={{ color: "#10b981" }} />}
            />
            <div
              className="stat-progress"
              style={{ background: "#10b981" }}
            ></div>
          </div>

          {/* <div className="bento-card stat-card hardware">
            <Statistic title="NHÀ CUNG CẤP" value={stats.totalBrands} prefix={<ShopOutlined style={{ color: '#06b6d4' }} />} />
            <div className="stat-progress" style={{ background: '#06b6d4' }}></div>
          </div> */}

          <div className="bento-card stat-card software">
            <Statistic
              title="DANH MỤC"
              value={stats.categories}
              prefix={<DatabaseOutlined style={{ color: "#f59e0b" }} />}
            />
            <div
              className="stat-progress"
              style={{ background: "#f59e0b" }}
            ></div>
          </div>
        </div>

        {/* PERSPECTIVE TABLE */}
        <div className="table-perspective-container">
          <div className="glass-table-card-3d">
            <div className="table-header-3d">
              <div className="search-engine-3d">
                <SearchOutlined style={{ color: "#94a3b8" }} />
                <input
                  placeholder="Tìm kiếm Model, nhãn hiệu hoặc thông số..."
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
                SPECIFICATIONS DATABASE LINKED
              </div> */}
            </div>

            <Table
              columns={columns}
              dataSource={data.filter(
                (i) =>
                  i.modelName
                    ?.toLowerCase()
                    .includes(filterText.toLowerCase()) ||
                  i.manufacturer
                    ?.toLowerCase()
                    .includes(filterText.toLowerCase()) ||
                  i.specs?.toLowerCase().includes(filterText.toLowerCase()),
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
        width={750}
        centered
        closable={false}
        className="modal-3d-supreme"
        destroyOnHidden
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>

          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="main-icon">
                <BlockOutlined />
              </div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>MODEL CONFIGURATION</span>
              <h2>
                {selectedModel
                  ? "Cập nhật phân loại thiết bị"
                  : "Khởi tạo phân loại thiết bị mới"}
              </h2>
            </div>

            <Form form={form} layout="vertical" onFinish={handleFinish}>
              <Row gutter={20}>
                <Col span={16}>
                  <Form.Item
                    name="modelName"
                    label="Tên phân loại thiết bị"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên model" },
                    ]}
                  >
                    <Input
                      className="input-3d"
                      placeholder="Ví dụ: Laptop Dell Latitude 5420"
                    />
                  </Form.Item>
                </Col>
                {/* <Col span={8}>
                  <Form.Item name="manufacturer" label="Nhà cung cấp" rules={[{ required: true }]}>
                    <Select className="select-3d" placeholder="Chọn hãng" showSearch>
                      {vendors.map(v => <Option key={v.id} value={v.name}>{v.name}</Option>)}
                    </Select>
                  </Form.Item>
                </Col> */}
              </Row>

              <Row gutter={20}>
                <Col span={12}>
                  <Form.Item
                    name="categoryId"
                    label="Phân loại danh mục"
                    rules={[
                      { required: true, message: "Vui lòng chọn danh mục!" },
                    ]}
                  >
                    <Select
                      className="select-3d"
                      showSearch // Bật tính năng tìm kiếm
                      placeholder="Gõ để tìm loại..."
                      optionFilterProp="children" // Tìm kiếm dựa trên nội dung giữa thẻ <Option>
                      // Logic tìm kiếm: Không phân biệt hoa thường, hỗ trợ tiếng Việt
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {categories.map((cat) => (
                        <Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="imageURL" label="Ảnh minh họa (URL)">
                    <Input
                      className="input-3d"
                      prefix={<PictureOutlined />}
                      placeholder="https://image-link.com/photo.jpg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="specs" label="Thông số kỹ thuật chi tiết">
                <Input.TextArea
                  rows={4}
                  className="input-3d"
                  placeholder="Nhập CPU, RAM, Ổ cứng, Màn hình hoặc các thông số đặc thù..."
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
                {globalLoading && (
                  <div className="global-loading-overlay">
                    <Spin size="large" tip="Đang đồng bộ dữ liệu thiết bị..." />
                  </div>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  className="btn-submit-3d"
                  style={{ width: "220px" }}
                >
                  XÁC NHẬN LƯU
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModelList;
