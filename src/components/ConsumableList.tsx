import React, { useEffect, useState, useCallback } from "react";

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
  InputNumber,
  Statistic,
  Progress,
  Row,
  Col,
  Tooltip,
  Checkbox,
  Spin,
} from "antd";

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BlockOutlined,
  ContainerOutlined,
  SwapOutlined,
  ShoppingOutlined,
  InfoCircleOutlined,
  DeploymentUnitOutlined,
  HistoryOutlined,
  PieChartOutlined,
  UserOutlined,
  RollbackOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { consumableService } from "../services/useConsumableService";

import "../CSS/GlobalStyle.css";

import { debounce } from "lodash";

import { employeeService } from "../services/assignmentService";

const { Title, Text } = Typography;

const { Option } = Select;

const ConsumableList: React.FC = () => {
  const [globalLoading, setGlobalLoading] = useState(false);

  const [form] = Form.useForm();

  const [transForm] = Form.useForm();

  const [data, setData] = useState<any[]>([]);

  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isTransModalOpen, setIsTransModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [historyData, setHistoryData] = useState<any[]>([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyPagination, setHistoryPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  const [isBroken, setIsBroken] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [historySearch, setHistorySearch] = useState("");

  // Thêm các state quản lý phân trang nhân viên

  const [empList, setEmpList] = useState<any[]>([]);

  const [empPage, setEmpPage] = useState(1);

  const [empLoading, setEmpLoading] = useState(false);

  const [empHasMore, setEmpHasMore] = useState(true);

  const [empSearch, setEmpSearch] = useState("");

  // Hàm fetch paged cho Select

  const loadEmployees = async (
    search: string,
    pageNum: number,
    isAppend: boolean,
  ) => {
    setEmpLoading(true);

    try {
      // Sử dụng service lookup paged

      const res = await employeeService.getLookupPaged(search, pageNum);

      const data = res.data || res; // Tùy cấu trúc API của bạn

      if (isAppend) {
        setEmpList((prev) => [...prev, ...data]);
      } else {
        setEmpList(data);
      }

      setEmpHasMore(data.length === 20);

      setEmpPage(pageNum);
    } catch (err) {
      console.error("Error loading employees", err);
    } finally {
      setEmpLoading(false);
    }
  };

  // Debounce search

  const debouncedEmpSearch = useCallback(
    debounce((value: string) => {
      loadEmployees(value, 1, false);
    }, 500),

    [],
  );

  // Gọi lần đầu khi Modal mở

  useEffect(() => {
    if (isTransModalOpen) {
      setEmpSearch("");

      loadEmployees("", 1, false);
    }
  }, [isTransModalOpen]);

  const fetchApiData = useCallback(
    async (page = 1, search = searchText, pageSize = pagination.pageSize) => {
      setLoading(true);
      try {
        const response: any = await consumableService.getAll({
          searchTerm: search,
          page,
          pageSize,
        });
        const apiResult = response.data;

        setData(apiResult?.data?.items || []);

        // CẬP NHẬT Ở ĐÂY: Thêm pageSize vào state
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize, // Lưu lại kích thước trang mới vào state
          total: apiResult?.data?.totalCount || 0,
        }));

        const resCats: any = await consumableService.getCategories();
        setCategories(resCats?.data?.data || resCats?.data || []);
      } catch (err) {
        message.error("Lỗi đồng bộ dữ liệu");
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [pagination.pageSize],
  ); // Chỉ phụ thuộc vào searchText, pageSize đã được truyền qua tham số

  const fetchHistory = useCallback(
    async (
      id: number,
      page = 1,
      search = "",
      pageSize = historyPagination.pageSize,
    ) => {
      setHistoryLoading(true);
      try {
        const res: any = await consumableService.getIssueHistory(id, {
          page,
          pageSize: pageSize, // Sử dụng giá trị pageSize mới truyền vào
          searchTerm: search,
        });

        const resData = res.data?.data;
        setHistoryData(resData?.items || []);

        // CẬP NHẬT Ở ĐÂY
        setHistoryPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize, // THÊM DÒNG NÀY: Cập nhật size mới vào state
          total: resData?.totalCount || 0,
        }));
      } catch (err) {
        message.error("Lỗi tải lịch sử");
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyPagination.pageSize],
  ); // Dependency này đúng rồi

  useEffect(() => {
    fetchApiData(1, ""); // load lần đầu không search
  }, []); // ← chạy 1 lần duy nhất

  // --- HANDLERS ---

  const handleSaveConsumable = async (values: any) => {
    setGlobalLoading(true);
    try {
      if (selectedItem?.id) {
        await consumableService.update(selectedItem.id, values);

        message.success("Cập nhật thành công");
      } else {
        await consumableService.create(values);

        message.success("Khởi tạo thành công");
      }

      setIsModalOpen(false);

      fetchApiData(pagination.current);
    } catch (err) {
      message.error("Thao tác thất bại");
    } finally {
      setGlobalLoading(false); // Đảm bảo tắt global loading sau khi thao tác hoàn tất
    }
  };

  const handleTransaction = async (values: any) => {
    if (!selectedItem?.id) return;
    setGlobalLoading(true);
    try {
      const finalType = values.isBroken ? "Broken" : values.type;

      await consumableService.executeTransaction({
        consumableId: selectedItem.id,

        transactionType: finalType,

        quantity: values.qty,

        employeeId: values.isBroken || values.type === "In" ? null : values.emp,

        note: values.isBroken ? "Báo hỏng hệ thống" : values.note,
      });

      message.success("Giao dịch thành công");

      setIsTransModalOpen(false);

      transForm.resetFields();

      setIsBroken(false);

      fetchApiData(pagination.current);
    } catch (err: any) {
      message.error(err.response?.data?.message || "Giao dịch thất bại");
    } finally {
      setGlobalLoading(false); // Đảm bảo tắt global loading sau khi thao tác hoàn tất
    }
  };

  const handleRevoke = async (transactionId: number) => {
    try {
      await consumableService.revokeTransaction(transactionId);

      message.success("Thu hồi thành công");

      if (selectedItem)
        fetchHistory(selectedItem.id, historyPagination.current);

      fetchApiData(pagination.current);
    } catch (err: any) {
      message.error("Lỗi thu hồi");
    } finally {
    }
  };

  const columns = [
    {
      title: "THÔNG TIN VẬT TƯ",

      key: "info",

      render: (record: any) => (
        <div className="asset-info-cell-3d">
          <div className="icon-box-3d">
            <BlockOutlined />
          </div>

          <div className="text-group-3d">
            <Text strong className="name-3d">
              {record.name}
            </Text>

            <div className="tag-row-3d">
              <Tag className="type-pill-3d">
                <div className="dot" style={{ background: "#3b82f6" }} />{" "}
                {record.category?.name || "N/A"}
              </Tag>

              <Text className="sub-path">
                <ContainerOutlined /> {record.location || "N/A"}
              </Text>
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "TỒN KHO THỰC TẾ",

      key: "stock",

      width: 250,

      render: (record: any) => {
        const current = record.currentStock || 0;

        const min = record.minStockLevel || 1;

        // Giả sử API trả về totalStock hoặc issuedQuantity (số lượng đã cấp)

        //const issued = record.issuedQuantity || 0;

        const isLow = current <= min;

        return (
          <div className="stock-display-3d">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "8px",
                color: "#3b82f6",
              }}
            >
              {/* Bên trái: Tồn hiện tại */}

              <div className={`depreciation-tag-3d ${isLow ? "low" : ""}`}>
                <span className="value">{current}</span>
                <span className="unit">{record.unit}</span> -
                <span className="minStockLevel">
                  Min: {record.minStockLevel}
                </span>
              </div>
            </div>

            <Tooltip title={`Hiện có: ${current} - Cảnh báo Min: ${min}`}>
              <Progress
                percent={Math.min((current / (min * 3 || 1)) * 100, 100)}
                showInfo={false}
                strokeColor={isLow ? "#f43f5e" : "#10b981"}
                strokeWidth={12} // <--- Đưa ra ngoài như thế này
                className="custom-progress-3d"
              />
            </Tooltip>

            {isLow && (
              <div
                className="pulse-text"
                style={{
                  color: "#f43f5e",
                  fontSize: "10px",
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <InfoCircleOutlined style={{ fontSize: "12px" }} />

                <span>CHẠM NGƯỠNG AN TOÀN ({min})</span>
              </div>
            )}
          </div>
        );
      },
    },

    {
      title: "THAO TÁC",

      key: "actions",

      align: "right" as const,

      render: (record: any) => (
        <Space size="small">
          <Tooltip title="Lịch sử">
            <Button
              className="btn-3d"
              style={{ color: "#095d36" }}
              icon={<HistoryOutlined />}
              onClick={() => {
                setSelectedItem(record);
                setIsHistoryModalOpen(true);
                fetchHistory(record.id, 1);
              }}
            />
          </Tooltip>

          <Tooltip title="Nhập/Xuất">
            <Button
              className="btn-3d"
              style={{ color: "#d62c84" }}
              icon={<SwapOutlined />}
              onClick={() => {
                setSelectedItem(record);
                setIsTransModalOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Sửa">
            <Button
              className="btn-3d"
              icon={<EditOutlined />}
              style={{ color: "#3b82f6" }}
              onClick={() => {
                setSelectedItem(record);
                form.setFieldsValue(record);
                setIsModalOpen(true);
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Xóa vật tư này?"
            onConfirm={() =>
              consumableService
                .delete(record.id)
                .then(() => {
                  message.success("Xóa vật tư thành công!"); // Hiện thông báo thành công
                  fetchApiData(pagination.current); // Tải lại dữ liệu bảng
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Xóa vật tư thất bại!"); // Hiện thông báo nếu có lỗi xảy ra
                })
            }
          >
            <Button className="btn-3d" danger icon={<DeleteOutlined />} />
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
            <div>
              {/* Thêm Icon vào Banner Badge */}

              <div className="banner-badge">
                <DatabaseOutlined />
                VINATECH CONSUMABLES HUB
              </div>

              <Title level={1} className="banner-title">
                Consumables
              </Title>

              <Text className="banner-subtitle">
                Quản lý vật tư tiêu hao & tồn kho thông minh
              </Text>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedItem(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
              className="btn-submit-3d"
            >
              Khởi tạo mới
            </Button>
          </div>

          <div className="bento-card stat-card">
            <Statistic
              title="TỔNG MỤC"
              value={pagination.total}
              prefix={<BlockOutlined />}
            />

            <div className="stat-progress" style={{ background: "#3b82f6" }} />
          </div>

          <div className="bento-card stat-card">
            <Statistic
              title="CẦN NHẬP"
              value={
                data.filter(
                  (i) => (i.currentStock || 0) <= (i.minStockLevel || 0),
                ).length
              }
              prefix={<InfoCircleOutlined />}
              styles={{ content: { color: "#f43f5e" } }}
            />

            <div className="stat-progress" style={{ background: "#f43f5e" }} />
          </div>

          <div className="bento-card stat-card">
            <Statistic
              title="NHÓM LOẠI"
              value={categories.length}
              prefix={<PieChartOutlined />}
            />

            <div className="stat-progress" style={{ background: "#10b981" }} />
          </div>
        </div>

        {/* --- TABLE AREA --- */}

        <div className="table-perspective-container">
          <Card className="glass-table-card-3d" variant="borderless">
            <div className="table-header-3d">
              <div className="search-engine-3d">
                <ShoppingOutlined />

                <input
                  placeholder="Tìm kiếm vật tư, mã, vị trí..."
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fetchApiData(1, searchText)
                  }
                />
              </div>

              {/* <div className="sync-status">

                <div className="pulse-dot"></div>

                DATA SYNCED: {new Date().toLocaleTimeString()}

              </div> */}
            </div>

            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: false,
                //pageSizeOptions: ['5', '10', '20', '50'],
                onChange: (p, ps) => {
                  const targetPage = ps !== pagination.pageSize ? 1 : p;
                  fetchApiData(targetPage, searchText, ps);
                },
                showTotal: (total) => (
                  <Text strong style={{ color: "#64748b" }}>
                    Tổng cộng {total} bản ghi
                  </Text>
                ),
              }}
            />
          </Card>
        </div>
      </div>

      {/* --- MODAL: ADD/EDIT --- */}

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        centered
        className="modal-3d-supreme"
        destroyOnHidden
        closable={false} // Bỏ dấu X ở góc
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>

          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="main-icon">
                <PlusOutlined />
              </div>

              <div className="particle p1"></div>

              <div className="particle p2"></div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>ASSET DEFINITION</span>

              <Title level={2}>{selectedItem ? "Cập Nhật" : "Khởi Tạo"}</Title>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSaveConsumable}>
              <Form.Item
                name="name"
                label="Tên vật tư"
                rules={[{ required: true }]}
              >
                <Input className="input-3d" placeholder="Tên sản phẩm..." />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="categoryId"
                    label="Danh mục"
                    rules={[{ required: true }]}
                  >
                    <Select className="select-3d" placeholder="Chọn loại">
                      {categories.map((c) => (
                        <Option key={c.id} value={c.id}>
                          {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="unit"
                    label="Đơn vị"
                    rules={[{ required: true }]}
                  >
                    <Select className="select-3d">
                      {["Cái", "Cuộn", "Bộ", "Kg", "Hộp"].map((u) => (
                        <Option key={u} value={u}>
                          {u}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="location" label="Vị trí kho">
                    <Input
                      className="input-3d"
                      prefix={<ContainerOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="minStockLevel" label="Cảnh báo Min">
                    <InputNumber className="input-3d w-100" min={0} />
                  </Form.Item>
                </Col>
              </Row>

              <Space className="w-100 justify-end mt-4">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-cancel-3d"
                >
                  Hủy
                </Button>
                {globalLoading && (
                  <div className="global-loading-overlay">
                    <Spin size="large" tip="Đang lưu vật tư tiêu hao..." />
                  </div>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  className="btn-submit-3d"
                >
                  Lưu dữ liệu
                </Button>
              </Space>
            </Form>
          </div>
        </div>
      </Modal>

      {/* --- MODAL: TRANSACTION --- */}

      <Modal
        open={isTransModalOpen}
        onCancel={() => {
          setIsTransModalOpen(false);
          setIsBroken(false);
          transForm.resetFields();
        }}
        footer={null}
        width={550}
        centered
        className="modal-3d-supreme"
        destroyOnHidden
        closable={false} // Bỏ dấu X ở góc
      >
        <div className="modal-inner-3d">
          {/* Thanh trang trí trên cùng */}

          <div className="modal-top-decor"></div>

          {/* CỤM ICON NỔI VÀ HIỆU ỨNG XOAY (ANTD VERSION) */}

          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              {/* Các hạt particle giữ nguyên để chạy animation orbit từ CSS của bạn */}

              <div className="particle p1"></div>

              <div className="particle p2"></div>

              <div
                className="main-icon"
                style={{
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",
                }}
              >
                {/* Thay thế ở đây */}

                <SwapOutlined style={{ fontSize: "36px" }} />
              </div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>TRANSACTION LOG</span>

              <Title level={2}>Điều Chỉnh Kho</Title>

              <Text strong style={{ color: "#3b82f6" }}>
                {selectedItem?.name}
              </Text>
            </div>

            <Form
              form={transForm}
              layout="vertical"
              onFinish={handleTransaction}
              initialValues={{ type: "Out", isBroken: false }}
              className="custom-form-3d"
            >
              <div
                className="type-pill-3d w-100 mb-4"
                style={{ justifyContent: "space-between", padding: "15px" }}
              >
                <Form.Item name="type" noStyle>
                  <Select
                    className="select-3d"
                    style={{ width: "160px" }}
                    disabled={isBroken}
                  >
                    <Option value="In">Nhập kho (+)</Option>

                    <Option value="Out">Xuất kho (-)</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="isBroken" valuePropName="checked" noStyle>
                  <Checkbox
                    className="checkbox-danger"
                    onChange={(e) => {
                      setIsBroken(e.target.checked);

                      transForm.setFieldsValue({
                        type: e.target.checked ? "Broken" : "Out",
                      });
                    }}
                  >
                    <Text type="danger" strong>
                      Báo hỏng
                    </Text>
                  </Checkbox>
                </Form.Item>
              </div>

              <Form.Item
                name="qty"
                label="Số lượng"
                rules={[
                  { required: true, message: "Vui lòng nhập số lượng" },

                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const type = getFieldValue("type");

                      // Chỉ chặn nếu là Xuất kho (Out) hoặc Báo hỏng (Broken)

                      if (
                        (type === "Out" || type === "Broken") &&
                        value > (selectedItem?.currentStock || 0)
                      ) {
                        return Promise.reject(
                          new Error(
                            `Vượt quá tồn kho thực tế (${selectedItem?.currentStock})`,
                          ),
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  className="input-3d w-100"
                  min={1}
                  placeholder="Nhập số lượng..."
                />
              </Form.Item>

              <Form.Item noStyle shouldUpdate>
                {() =>
                  transForm.getFieldValue("type") === "Out" && !isBroken ? (
                    <Form.Item
                      name="emp"
                      label="Người tiếp nhận"
                      rules={[
                        {
                          required: true,
                          message: "Chọn nhân viên nhận vật tư",
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        className="select-3d"
                        placeholder="Tìm mã hoặc tên..."
                        filterOption={false} // Tắt filter client để dùng server-side
                        onSearch={(val) => {
                          setEmpSearch(val);

                          debouncedEmpSearch(val);
                        }}
                        loading={empLoading}
                        notFoundContent={
                          empLoading ? <Spin size="small" /> : null
                        }
                        // Logic Infinite Scroll cho Select (Optionally)

                        onPopupScroll={(e) => {
                          const { scrollTop, scrollHeight, clientHeight } =
                            e.currentTarget;

                          if (
                            scrollHeight - scrollTop <= clientHeight + 10 &&
                            empHasMore &&
                            !empLoading
                          ) {
                            loadEmployees(empSearch, empPage + 1, true);
                          }
                        }}
                      >
                        {empList.map((e) => (
                          <Option
                            key={e.employeeId}
                            value={e.employeeId}
                            label={e.fullName}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    color: "#3b82f6",
                                    fontWeight: 800,
                                    marginRight: 8,
                                  }}
                                >
                                  {e.employeeId}
                                </span>

                                <span
                                  style={{ fontWeight: 600, color: "#1e293b" }}
                                >
                                  {e.fullName}
                                </span>
                              </div>

                              <div style={{ display: "flex", gap: "4px" }}>
                                <span className="mini-badge-dept">
                                  {e.department}
                                </span>

                                <span className="mini-badge-pos">
                                  {e.position}
                                </span>
                              </div>
                            </div>
                          </Option>
                        ))}

                        {empLoading && (
                          <Option
                            disabled
                            key="loading"
                            style={{ textAlign: "center" }}
                          >
                            <Spin size="small" />
                          </Option>
                        )}
                      </Select>
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              {/* Cụm nút thao tác mới */}
              <div
                className="modal-footer-3d mt-5"
                style={{ display: "flex", gap: "12px" }}
              >
                <Button
                  onClick={() => {
                    setIsTransModalOpen(false);
                    setIsBroken(false);
                    transForm.resetFields();
                  }}
                  className="btn-cancel-3d"
                  style={{ flex: 1 }}
                >
                  Hủy bỏ
                </Button>
                {globalLoading && (
                  <div className="global-loading-overlay">
                    <Spin
                      size="large"
                      tip="Đang đồng bộ dữ liệu toàn hệ thống..."
                    />
                  </div>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  className="btn-submit-3d"
                  style={{
                    flex: 2,
                    background: "#3b82f6",
                    boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  Xác nhận
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      {/* --- MODAL: HISTORY --- */}
      <Modal
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={null}
        width={850}
        centered
        className="modal-3d-supreme"
        destroyOnHidden
        closable={false}
      >
        <div className="modal-inner-3d">
          <div className="modal-top-decor"></div>

          <div className="modal-floating-icon-container">
            <div className="icon-orbit">
              <div className="main-icon" style={{ color: "#1e293b" }}>
                <HistoryOutlined />
              </div>
              <div className="particle p1"></div>
              <div className="particle p2"></div>
            </div>
          </div>

          <div className="modal-body-3d">
            <div className="modal-title-group">
              <span>AUDIT LOG SYSTEM</span>
              <h2>Lịch Sử Giao Dịch</h2>
              <div className="type-pill-3d" style={{ marginTop: "8px" }}>
                <span className="dot" style={{ background: "#3b82f6" }}></span>
                <span className="label" style={{ fontSize: "12px" }}>
                  {selectedItem?.name}
                </span>
              </div>
            </div>

            {/* --- THANH TÌM KIẾM MỚI --- */}
            <div
              style={{
                marginBottom: "20px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Input.Search
                placeholder="Tìm theo người nhận..."
                allowClear
                enterButton
                className="input-3d"
                style={{ width: "80%" }}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onSearch={(value) => {
                  // Truyền tham số search khi gọi API, reset về trang 1
                  fetchHistory(selectedItem.id, 1, value);
                }}
              />
            </div>

            <Table
              dataSource={historyData}
              loading={historyLoading}
              rowKey="id"
              pagination={{
                current: historyPagination.current, // Phải có cái này
                pageSize: historyPagination.pageSize, // CỰC KỲ QUAN TRỌNG: Để Table biết đang ở size nào
                total: historyPagination.total,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],

                onChange: (p, ps) => {
                  // Logic của bạn: Nếu đổi size thì về trang 1, nếu không thì đi tới trang p
                  const targetPage = ps !== historyPagination.pageSize ? 1 : p;

                  // Gọi API với tham số pageSize mới (ps)
                  fetchHistory(selectedItem.id, targetPage, historySearch, ps);
                },
                showTotal: (total) => (
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Tổng {total} dòng
                  </span>
                ),
              }}
              columns={[
                {
                  title: "THỜI GIAN",
                  dataIndex: "transactionDate",
                  render: (d) => (
                    <div
                      className="depreciation-tag-3d"
                      style={{
                        background: "rgba(241, 245, 249, 0.8)",
                        color: "#64748b",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <HistoryOutlined style={{ marginRight: "6px" }} />
                      <span className="value" style={{ fontSize: "11px" }}>
                        {new Date(d).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  ),
                },
                {
                  title: "LOẠI",
                  key: "type",
                  render: (r: any) => {
                    const config: Record<
                      string,
                      { color: string; label: string }
                    > = {
                      In: { color: "#10b981", label: "NHẬP KHO" },
                      Out: { color: "#3b82f6", label: "XUẤT KHO" },
                      Revoke: { color: "#f59e0b", label: "HOÀN TRẢ" },
                      Broken: { color: "#ef4444", label: "HỎNG/HỦY" },
                    };
                    const itemConfig = config[r.transactionType] || {
                      color: "#8b5cf6",
                      label: r.transactionType,
                    };
                    return (
                      <div className="type-pill-3d">
                        <span
                          className="dot"
                          style={{ background: itemConfig.color }}
                        ></span>
                        <span className="label">{itemConfig.label}</span>
                      </div>
                    );
                  },
                },
                {
                  title: "NGƯỜI NHẬN",
                  render: (r: any) => (
                    <div className="asset-info-cell-3d">
                      <div
                        className="icon-box-3d"
                        style={{ width: "30px", height: "30px" }}
                      >
                        <UserOutlined />
                      </div>
                      <div>
                        <div className="name-3d" style={{ fontSize: "13px" }}>
                          {r.employeeName || ""}
                        </div>
                        <div className="sub-path">
                          ID: {r.employeeId || "N/A"}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "PHÒNG BAN",
                  render: (r: any) => (
                    <div className="asset-info-cell-3d">
                      <div
                        className="icon-box-3d"
                        style={{ width: "30px", height: "30px" }}
                      >
                        <DeploymentUnitOutlined />
                      </div>
                      <div>
                        <div className="name-3d" style={{ fontSize: "13px" }}>
                          {r.employeeDepartment || ""}
                        </div>
                      </div>
                    </div>
                  ),
                },
                { title: "SL", dataIndex: "quantity", align: "center" },
                {
                  title: "",
                  key: "action",
                  align: "right",
                  render: (r: any) =>
                    !r.isRevoked &&
                    r.transactionType === "Out" && (
                      <Popconfirm
                        title="Xác nhận hoàn trả thiết bị?"
                        onConfirm={() => handleRevoke(r.id)}
                        cancelText="Hủy"
                        okText="Trả"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<RollbackOutlined />}
                          className="btn-3d-revoke-cyan"
                          style={{
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            height: "32px",
                            width: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      </Popconfirm>
                    ),
                },
              ]}
            />

            <div
              style={{
                marginTop: "30px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Button
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setHistorySearch(""); // Reset search khi đóng
                }}
                className="btn-cancel-3d"
                style={{ width: "150px" }}
              >
                ĐÓNG NHẬT KÝ
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ConsumableList;
