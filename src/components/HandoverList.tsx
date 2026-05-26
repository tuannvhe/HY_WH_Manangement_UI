import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Space,
  message,
  Tooltip,
  Descriptions,
  Divider,
  Skeleton,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  HistoryOutlined,
  DownloadOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  UserOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { QrcodeOutlined } from "@ant-design/icons";
import { AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import {
  handoverService,
  type HandoverReceipt,
} from "../services/useHandoverService";
import "../CSS/GlobalStyle.css";
import "../CSS/HandoverList.css";
import axiosClient from "../axiosClient";
import { generateQrPdf } from "../utils/generateQrPdf";
import { makeQrDetailUrl } from "../utils/qrUtils";

const { Title, Text } = Typography;

const HandoverList: React.FC = () => {
  const [data, setData] = useState<HandoverReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly React.Key[]>(
    [],
  );
  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>(
    {},
  );
  const [pageSize, setPageSize] = useState(10); // State mới

  const toggleExpand = async (record: HandoverReceipt) => {
    const isExpanded = expandedRowKeys.includes(record.id);
    if (isExpanded) {
      setExpandedRowKeys([]);
    } else {
      // Nếu chưa có data chi tiết thì load
      if (!record.items || record.items.length === 0) {
        try {
          setDetailLoading((prev) => ({ ...prev, [record.id]: true }));
          setExpandedRowKeys([record.id]); // Mở khung skeleton trước
          const fullData = await handoverService.getById(record.id);
          setData((prevData) =>
            prevData.map((item) =>
              item.id === record.id ? { ...fullData } : item,
            ),
          );
        } catch (error) {
          message.error("Không thể lấy chi tiết");
          setExpandedRowKeys([]);
        } finally {
          setDetailLoading((prev) => ({ ...prev, [record.id]: false }));
        }
      } else {
        setExpandedRowKeys([record.id]);
      }
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
      message.success("Tải xuống biên bản thành công!");
    } catch (error) {
      message.error("Lỗi khi tải file từ hệ thống.");
    }
  };

  const downloadQrList = async (record: HandoverReceipt) => {
    try {
      let full = record;
      if (!record.items || record.items.length === 0) {
        full = await handoverService.getById(record.id);
      }

      const employee = {
        userId: full.receiverId || null,
        name: full.receiverName || null,
        department: full.receiverDept || null,
      };

      console.log("employee HandoverList:", employee);

      const assets: any[] = [];
      for (const it of full.items || []) {
        const qty = it.quantity || 1;
        const assetTag = (it as any).assetTag || `${it.assetName}`;

        // Tạo QR value với employee
        const qrValue = makeQrDetailUrl(
          {
            id: (it as any).assetId,
            assetTag: assetTag,
            serial: (it as any).serial || "",
            specs: it.specification || "",
          },
          employee, // ← Truyền employee vào đây
        );

        console.log(`QR Value for ${assetTag}:`, qrValue);

        for (let i = 0; i < qty; i++) {
          assets.push({
            id: (it as any).assetId || null,
            modelName: it.assetName,
            assetTag: assetTag,
            serial: (it as any).serial || "",
            specs: it.specification || "",
            qrValue: qrValue, // ← Đã có employee info trong qrValue
          });
        }
      }

      if (assets.length === 0) {
        message.warning("Không có mục nào để tạo QR.");
        return;
      }

      // Gọi generate PDF - KHÔNG tạo lại QR bên trong
      await generateQrPdf(assets, `QR_List_${record.receiptNumber}.pdf`, {
        recipientName: record.receiverName,
        department: record.receiverDept,
        code: record.receiverId,
        handoverId: record.id,
      });

      message.success("Tải xuống danh sách QR thành công!");
    } catch (err) {
      console.error("Lỗi khi tạo QR list:", err);
      message.error("Không thể tạo danh sách QR.");
    }
  };
  const loadData = async (
    currentSearch: string,
    currentPage: number,
    currentPageSize: number,
  ) => {
    try {
      setLoading(true);
      // Truyền currentPageSize vào Service thay vì số 10 cố định
      const res = await handoverService.getAll(
        currentSearch,
        currentPage,
        currentPageSize,
      );

      setData(res.items || []);
      setTotal(res.totalCount || 0);
    } catch (err) {
      message.error("Lỗi đồng bộ dữ liệu biên bản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData("", page, pageSize);
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    loadData(searchText, 1, pageSize);
  };
  const expandColumns = useMemo(
    () => [
      {
        title: "TÊN TÀI SẢN",
        dataIndex: "assetName",
        render: (t: string) => (
          <Text strong className="asset-name-glow">
            {t}
          </Text>
        ),
      },
      {
        title: "THÔNG SỐ",
        dataIndex: "specification",
        render: (s: string) => (
          <span className="spec-tag-v2">{s || "N/A"}</span>
        ),
      },
      {
        title: "SL",
        dataIndex: "quantity",
        align: "center" as const,
        render: (q: number) => <div className="qty-badge-3d">{q}</div>,
      },
    ],
    [],
  );
  const renderDetails = (record: HandoverReceipt) => (
    <div className="detail-expanded-wrapper">
      <div className="detail-glass-card-3d">
        <div className="detail-header-v2">
          <div className="header-glow-icon">
            <AuditOutlined />
          </div>
          <div className="header-text-group">
            <Text className="header-label">CHI TIẾT BÀN GIAO</Text>
            <Title level={4} className="header-main-title">
              {record.receiptNumber}
            </Title>
          </div>
        </div>

        <Descriptions
          bordered
          size="small"
          column={{ xxl: 2, xl: 2, lg: 1 }}
          className="premium-descriptions-v2"
        >
          <Descriptions.Item label="Nhân viên nhận">
            <Text strong style={{ color: "#0f766e" }}>
              {record.receiverName}
            </Text>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Mã NV: {record.receiverId}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Bộ phận">
            {record.receiverDept}
          </Descriptions.Item>
          <Descriptions.Item label="Người bàn giao">
            <div style={{ fontSize: "14px", color: "#0065f3" }}>
              {record.senderName}
            </div>
          </Descriptions.Item>
          {/* <Descriptions.Item label="Vị trí">
                        <Tag icon={<DeploymentUnitOutlined />} className="location-tag-3d">
                            {record.location || 'Bắc Giang #1'}
                        </Tag>
                    </Descriptions.Item> */}
          <Descriptions.Item label="Địa điểm bàn giao">
            {record.location}
          </Descriptions.Item>
        </Descriptions>

        <div className="inner-table-section">
          <Divider>
            <Space>
              <ThunderboltOutlined style={{ color: "#10b981" }} />{" "}
              <Text strong>DANH MỤC TÀI SẢN</Text>
            </Space>
          </Divider>

          <Table
            dataSource={record.items}
            pagination={false}
            rowKey="id"
            size="small"
            columns={expandColumns} // ← dùng columns đã memo
          />
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      title: "BIÊN BẢN",
      dataIndex: "receiptNumber",
      key: "receiptNumber",
      width: 280,
      render: (text: string) => (
        <div className="receipt-primary-cell">
          <div className="receipt-3d-icon">
            <FileTextOutlined />
          </div>
          <div className="receipt-content">
            <Text strong className="receipt-code-v3">
              {text}
            </Text>
            {/* <div className="receipt-tag-group">
                            <span className="location-badge-v3">
                                <DeploymentUnitOutlined /> {record.location || 'Bắc Giang #1'}
                            </span>
                        </div> */}
          </div>
        </div>
      ),
    },
    {
      title: "NHÂN VIÊN TIẾP NHẬN",
      dataIndex: "receiverName",
      key: "receiverName",
      width: 380,
      render: (name: string, record: HandoverReceipt) => (
        <div className="receiver-card-lite">
          <div className="avatar-emerald-glow">
            {/* Thay chữ cái bằng Icon */}
            <UserOutlined style={{ fontSize: "18px" }} />
          </div>
          <div className="receiver-meta">
            <Text strong className="receiver-name-v3">
              {name} - {record.receiverId}
            </Text>
            <div className="dept-label-v3">{record.receiverDept}</div>
          </div>
        </div>
      ),
    },
    {
      title: "THỜI GIAN",
      dataIndex: "handoverDate",
      key: "handoverDate",
      width: 230,
      render: (date: string) => (
        <div className="date-capsule-v3">
          <CalendarOutlined />
          <span className="date-text-v3" style={{ color: "#0ca8f6" }}>
            {dayjs(date).format("DD/MM/YYYY")}
          </span>
        </div>
      ),
    },
    {
      title: "CHI TIẾT",
      key: "expand",
      width: 120,
      align: "center" as const,
      render: (record: HandoverReceipt) => (
        <Button
          type="text"
          className={`btn-expand-premium ${expandedRowKeys.includes(record.id) ? "active" : ""}`}
          icon={<HistoryOutlined />}
          onClick={() => toggleExpand(record)}
        >
          {expandedRowKeys.includes(record.id) ? "Đóng" : "Xem"}
        </Button>
      ),
    },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right" as const,
      render: (record: HandoverReceipt) => (
        <Space size="small">
          <Tooltip title="Tải xuống biên bản bàn giao">
            <Button
              style={{ color: "#0ca8f6" }}
              className="btn-3d"
              icon={<DownloadOutlined />}
              onClick={() => downloadHandoverFile(record.id)}
            />
          </Tooltip>
          <Tooltip title="Tải danh sách QR">
            <Button
              className="btn-3d"
              style={{ color: "#8b5cf6" }}
              icon={<QrcodeOutlined />}
              onClick={() => downloadQrList(record)}
            />
          </Tooltip>
          {/* <Popconfirm title="Xóa biên bản này?" onConfirm={() => handoverService.delete(record.id).then(() => loadData(searchText, page, pageSize))}>
                        <Button style={{ color: 'red' }} className="btn-3d" icon={<DeleteOutlined />} />
                    </Popconfirm> */}
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-page-container">
      <div className="page-fade-in">
        {/* BENTO HEADER ĐỒNG BỘ VỚI CATEGORYLIST */}
        <div className="bento-header-wrapper">
          <div className="bento-card welcome-banner">
            <div className="banner-content">
              <div className="banner-badge">
                <ThunderboltOutlined /> VINATECH ASSET
              </div>
              <Title level={1} className="banner-title">
                Handover Intelligence
              </Title>
              <Text className="banner-subtitle">
                Quản lý lịch sử bàn giao & thu hồi thiết bị
              </Text>
            </div>
            {/* <Button
                            type="primary"
                            size="large"
                            icon={<ExportOutlined />}
                            className="btn-submit-3d"
                            style={{ width: '200px' }}
                        >
                            LẬP PHIẾU MỚI
                        </Button> */}
          </div>

          <div className="bento-card stat-card hardware">
            <Statistic
              title="Tổng số phiếu"
              value={total}
              prefix={<FileTextOutlined style={{ color: "#06b6d4" }} />}
            />
            <div
              className="stat-progress"
              style={{ background: "#06b6d4" }}
            ></div>
          </div>

          {/* <div className="bento-card stat-card software">
                        <Statistic title="Nhân viên nhận" value={data.length} prefix={<TeamOutlined style={{ color: '#10b981' }} />} />
                        <div className="stat-progress" style={{ background: '#10b981' }}></div>
                    </div>

                    <div className="bento-card stat-card another">
                        <Statistic title="Cần xử lý" value={0} prefix={<HistoryOutlined style={{ color: '#8b5cf6' }} />} />
                        <div className="stat-progress" style={{ background: '#8b5cf6' }}></div>
                    </div> */}
        </div>

        {/* TABLE PERSPECTIVE */}
        <div className="table-perspective-container">
          <Card className="glass-table-card-3d" variant="borderless">
            <div className="table-header-3d">
              <div className="search-engine-3d">
                <SearchOutlined />
                <input
                  placeholder="Tìm kiếm phiếu bàn giao..."
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
              dataSource={data}
              rowKey="id"
              loading={loading}
              tableLayout="fixed"
              pagination={{
                current: page,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total) => `Tổng cộng ${total} biên bản`,
                // Quan trọng: Xử lý thay đổi trang và kích thước trang
                onChange: (p, ps) => {
                  setPage(ps !== pageSize ? 1 : p); // Nếu đổi size, ép về trang 1
                  setPageSize(ps);

                  const targetPage = ps !== pageSize ? 1 : p;
                  loadData(searchText, targetPage, ps);
                },
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <AnimatePresence mode="wait">
                    {detailLoading[record.id] ? (
                      <div className="skeleton-detail-wrapper">
                        <Skeleton active paragraph={{ rows: 4 }} />
                      </div>
                    ) : (
                      renderDetails(record)
                    )}
                  </AnimatePresence>
                ),
                expandedRowKeys,
                showExpandColumn: false, // Ẩn cột expand mặc định của Antd
              }}
              // Bỏ onRow onClick cũ để tránh xung đột
              className="custom-table-3d"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HandoverList;
