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
  DatePicker,
  InputNumber,
  Select,
  Tag,
} from "antd";

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ToolOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  UserOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  maintenanceLogService,
  type AssetLookup,
  type MaintenanceLog,
} from "../services/useMaintenanceLogService";

import "../CSS/GlobalStyle.css";

type MaintenanceLogWithAsset = MaintenanceLog & {
  asset?: {
    id?: number;

    assetTag: string;

    serial?: string;

    name?: string;

    status?: string;
  };
};

const { Title, Text } = Typography;

const { Option } = Select;

const MaintenanceLogList: React.FC = () => {
  const [form] = Form.useForm();

  const [data, setData] = useState<MaintenanceLogWithAsset[]>([]);

  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedLog, setSelectedLog] =
    useState<MaintenanceLogWithAsset | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [currentActivePage, setCurrentActivePage] = useState(1);

  const [committedSearch, setCommittedSearch] = useState("");

  const [assetLookups, setAssetLookups] = useState<AssetLookup[]>([]);

  const [searchingAsset, setSearchingAsset] = useState(false);

  const loadAssetLookup = async (value?: string) => {
    try {
      setSearchingAsset(true);

      const res = await maintenanceLogService.getAssetLookup(value);

      setAssetLookups(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách thiết bị", err);
    } finally {
      setSearchingAsset(false);
    }
  };

  const [serverStats, setServerStats] = useState({
    totalLogs: 0,

    upcomingMaintenanceCount: 0,

    totalCostCurrentMonth: 0,
  });

  const [totalCount, setTotalCount] = useState(0); // Cho phân trang

  const loadData = async (page: number, search: string) => {
    try {
      setLoading(true);

      const res = await maintenanceLogService.getAll({ page, size: 8, search });

      const { items, totalCount, stats } = res.data;

      setData(items || []);

      setTotalCount(totalCount || 0);

      if (stats) {
        setServerStats(stats);
      }
    } catch (err) {
      message.error("Lỗi đồng bộ dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCommittedSearch(searchText);

    setCurrentActivePage(1);

    loadData(1, searchText);
  };

  useEffect(() => {
    loadData(1, "");
    loadAssetLookup();
  }, []);

  const openModal = (log: MaintenanceLogWithAsset | null = null) => {
    setSelectedLog(log);

    loadAssetLookup();

    if (log) {
      form.setFieldsValue({
        ...log,

        serviceDate: log.serviceDate ? dayjs(log.serviceDate) : null,

        nextServiceDate: log.nextServiceDate
          ? dayjs(log.nextServiceDate)
          : null,
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        serviceDate: dayjs(),

        cost: 0,
      });
    }

    setIsModalOpen(true);
  };

  const handleFinish = async (values: any) => {
    setSubmitting(true);

    try {
      const payload: MaintenanceLog = {
        ...values,

        id: selectedLog?.id,

        assetId: values.assetId,

        description: values.description,

        technician: values.technician,

        replacementParts: values.replacementParts,

        serviceDate: values.serviceDate
          ? values.serviceDate.format("YYYY-MM-DD")
          : "",

        nextServiceDate: values.nextServiceDate
          ? values.nextServiceDate.format("YYYY-MM-DD")
          : undefined,

        cost: Number(values.cost || 0),
      };

      if (selectedLog?.id) {
        await maintenanceLogService.update(selectedLog.id, payload);

        message.success("Cập nhật nhật ký bảo dưỡng thành công");
      } else {
        await maintenanceLogService.create(payload);

        message.success("Tạo mới nhật ký bảo dưỡng thành công");
      }

      setIsModalOpen(false);

      loadData(1, "");
    } catch (err) {
      message.error("Thao tác bảo dưỡng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLog = async (id: number) => {
    try {
      await maintenanceLogService.delete(id);

      message.success("Đã xóa nhật ký bảo dưỡng");

      loadData(1, "");
    } catch (err) {
      message.error("Xóa nhật ký thất bại");
    }
  };

  const columns = [
    {
      title: "THIẾT BỊ",

      key: "asset",

      render: (_value: unknown, record: MaintenanceLogWithAsset) => (
        <div className="asset-info-cell-3d">
          <div
            className="icon-box-3d"
            style={{
              //background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',

              boxShadow: "0 4px 10px rgba(6, 182, 212, 0.2)",
            }}
          >
            <ToolOutlined style={{ color: "#10b981" }} />
          </div>

          <div className="text-group">
            <Text strong className="model-name-3d-cyan">
              {record.asset?.assetTag || `ID #${record.assetId}`}
            </Text>

            <div className="serial-number-v2">
              <span>Serial:</span> {record.asset?.serial || "N/A"}
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "THỜI GIAN",

      key: "date_group",

      render: (record: MaintenanceLog) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <CalendarOutlined style={{ color: "#10b981", fontSize: "12px" }} />

            <Text strong style={{ fontSize: "13px" }}>
              {dayjs(record.serviceDate).format("DD/MM/YYYY")}
            </Text>
          </div>

          {record.nextServiceDate && (
            <Text
              type="secondary"
              style={{
                fontSize: "11px",
                marginLeft: "18px",
                fontWeight: "bold",
              }}
            >
              Kế tiếp:{" "}
              {dayjs(record.nextServiceDate).format("DD/MM/YYYY") || "N/A"}
            </Text>
          )}
        </div>
      ),
    },

    {
      title: "NHÂN SỰ & PHỤ TÙNG",

      key: "tech_parts",

      render: (record: MaintenanceLog) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Tag
            icon={<UserOutlined />}
            color="#10b981"
            style={{
              borderRadius: "6px",
              border: "none",
              width: "fit-content",
            }}
          >
            {record.technician || "Admin"}
          </Tag>

          {record.replacementParts && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <PlusOutlined style={{ fontSize: "10px" }} />{" "}
              {record.replacementParts}
            </div>
          )}
        </div>
      ),
    },

    {
      title: "CHI PHÍ",

      dataIndex: "cost",

      key: "cost",

      align: "center" as const,

      render: (value: number) => (
        <div
          className="qty-capsule-cyan"
          style={{ justifyContent: "center", minWidth: "100px" }}
        >
          <DollarOutlined />

          <span style={{ marginLeft: "4px", fontWeight: 800 }}>
            {value?.toLocaleString("vi-VN")}
          </span>

          <span style={{ fontSize: "10px", marginLeft: "2px", opacity: 0.8 }}>
            đ
          </span>
        </div>
      ),
    },

    {
      title: "TRẠNG THÁI & MÔ TẢ",

      key: "desc",

      render: (record: MaintenanceLog) => (
        <div style={{ maxWidth: 220 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "2px",
            }}
          >
            {/* Auto-status dựa trên ngày hiện tại */}

            <Tag
              color="processing"
              style={{ fontSize: "12px", borderRadius: "4px" }}
            >
              {record.description}
            </Tag>
          </div>
        </div>
      ),
    },

    {
      title: "THAO TÁC",

      key: "actions",

      align: "right" as const,

      render: (record: MaintenanceLog) => (
        <Space size="middle">
          <Button
            type="text"
            className="btn-3d-cyan-small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />

          <Popconfirm
            title="Xóa bản ghi này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => deleteLog(record.id!)}
          >
            <Button
              type="text"
              //className="btn-3d-revoke-cyan"

              icon={<DeleteOutlined style={{ color: "#ef4444" }} />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-page-container">
      <div className="page-fade-in">
        <div className="bento-header-wrapper">
          <div className="bento-card welcome-banner">
            <div className="banner-content">
              <div className="banner-badge">
                <ToolOutlined /> MAINTENANCE HUB
              </div>

              <Title level={1} className="banner-title">
                Bảo dưỡng thiết bị
              </Title>

              <Text className="banner-subtitle">
                Quản lý lịch sử bảo dưỡng và chi phí thiết bị
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
              THÊM BẢO DƯỠNG
            </Button>
          </div>

          <div className="bento-card stat-card total">
            <Statistic
              title="TỔNG NHẬT KÝ"
              value={serverStats.totalLogs}
              prefix={<CheckCircleOutlined style={{ color: "#10b981" }} />}
            />

            <div
              className="stat-progress"
              style={{ background: "#10b981" }}
            ></div>
          </div>

          <div className="bento-card stat-card hardware">
            <Statistic
              title="BẢO TRÌ 7 NGÀY TỚI"
              value={serverStats.upcomingMaintenanceCount}
              prefix={<CalendarOutlined style={{ color: "#06b6d4" }} />}
            />

            <div
              className="stat-progress"
              style={{ background: "#06b6d4" }}
            ></div>
          </div>

          <div className="bento-card stat-card software">
            <Statistic
              title="TỔNG CHI THÁNG NÀY"
              value={serverStats.totalCostCurrentMonth}
              prefix={<DollarOutlined style={{ color: "#f59e0b" }} />}
            />

            <div
              className="stat-progress"
              style={{ background: "#f50b0b" }}
            ></div>
          </div>
        </div>

        <div className="table-perspective-container">
          <div className="glass-table-card-3d">
            <div className="table-header-3d">
              <div className="search-engine-3d">
                <SearchOutlined style={{ color: "#94a3b8" }} />

                <input
                  placeholder="Tìm kiếm asset, kỹ thuật viên hoặc mô tả..."
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
                LỌC
              </Button>

            </div>

            <Table
              columns={columns}
              dataSource={data} // Dùng data trực tiếp từ State
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentActivePage,

                total: totalCount,

                pageSize: 8,

                showSizeChanger: false,

                onChange: (page) => {
                  setCurrentActivePage(page);

                  loadData(page, committedSearch);
                },

                showTotal: (total) => (
                  <Text strong style={{ color: "#64748b" }}>
                    Tổng cộng {total} bản ghi
                  </Text>
                ),
              }}
              scroll={{ x: 1000 }}
            />
          </div>
        </div>
      </div>

      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={780}
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

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>MAINTENANCE RECORD</span>

              <h2>
                {selectedLog ? "Chỉnh sửa nhật ký" : "Thêm nhật ký bảo dưỡng"}
              </h2>
            </div>

            <Form form={form} layout="vertical" onFinish={handleFinish}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="assetId"
                    label="Thiết bị đang bảo trì"
                    rules={[
                      { required: true, message: "Vui lòng chọn thiết bị" },
                    ]}
                  >
                    <Select
                      className="select-3d asset-select-emerald"
                      showSearch
                      placeholder="Tìm mã, tên hoặc model thiết bị..."
                      loading={searchingAsset}
                      onSearch={(val) => loadAssetLookup(val)}
                      filterOption={false}
                      allowClear
                    >
                      {assetLookups.map((asset) => (
                        <Option key={asset.id} value={asset.id}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              padding: "4px 0",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text strong style={{ color: "#059669" }}>
                                {asset.assetTag}
                              </Text>

                              {/* Hiển thị Model Name nổi bật hơn */}

                              <Text
                                style={{ fontSize: "12px", fontWeight: 600 }}
                              >
                                {asset.modelName}
                              </Text>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: "2px",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: "11px" }}
                              >
                                SN: {asset.serial || "N/A"}
                              </Text>

                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "11px",
                                  fontStyle: "italic",
                                }}
                              >
                                {asset.modelName
                                  ? `Model: ${asset.modelName}`
                                  : "Không có thông tin model"}
                              </Text>
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="serviceDate"
                    label="Ngày bảo dưỡng"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ngày bảo dưỡng",
                      },
                    ]}
                  >
                    <DatePicker
                      className="input-3d"
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="Mô tả công việc"
                rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
              >
                <Input.TextArea
                  rows={3}
                  className="input-3d"
                  placeholder="Ghi chú công việc đã thực hiện..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="technician" label="Kỹ thuật viên">
                    <Input
                      className="input-3d"
                      placeholder="Tên người thực hiện..."
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="cost"
                    label="Chi phí"
                    rules={[
                      { required: true, message: "Vui lòng nhập chi phí" },
                    ]}
                  >
                    <InputNumber
                      className="input-3d"
                      style={{ width: "100%" }}
                      min={0}
                      formatter={(value) =>
                        `${value}`.replace(/(?=(\d{3})+(?!\d))/g, ",")
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="replacementParts" label="Linh kiện thay thế">
                <Input.TextArea
                  rows={2}
                  className="input-3d"
                  placeholder="Danh sách linh kiện hoặc mã phụ tùng..."
                />
              </Form.Item>

              <Form.Item
                name="nextServiceDate"
                label="Ngày bảo dưỡng tiếp theo"
              >
                <DatePicker
                  className="input-3d"
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <Button
                  className="btn-cancel-3d"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  className="btn-submit-3d"
                >
                  Lưu
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaintenanceLogList;
