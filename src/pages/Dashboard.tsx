import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Skeleton,
  Progress,
  message,
} from "antd";
import {
  ThunderboltOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Import đúng service và các interface cần thiết
import {
  dashboardService,
  type DashboardData, // Import interface này để dùng cho useState
} from "../services/useDashboardService";
import "../CSS/Dashboard.css";
import { AnimatedNumber } from "../components/AnimatedNumber";

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getSummary();
      setData(result);
    } catch (error) {
      // Thông báo lỗi thân thiện hơn cho nhân viên Vinatech
      message.error("Không thể kết nối với máy chủ hệ thống!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Xử lý loading state ban đầu
  if (loading && !data) {
    return (
      <div style={{ padding: "24px" }}>
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      </div>
    );
  }

  const stats = data?.stats;

  // Dữ liệu cho Donut Chart (Trạng thái thiết bị)
  const assetStatusData = [
    { name: "Sử dụng", value: stats?.assignedAssets || 0, color: "#10b981" },
    { name: "Sẵn sàng", value: stats?.availableAssets || 0, color: "#3b82f6" },
    { name: "Bảo trì", value: stats?.maintenanceAssets || 0, color: "#f59e0b" },
    { name: "Hỏng hóc", value: stats?.brokenAssets || 0, color: "#ef4444" },
  ];

  // Dữ liệu cho Bar Chart (Bảo hành)
  const warrantyData = [
    { name: "Còn hạn", value: stats?.warrantyActive || 0, color: "#10b981" },
    {
      name: "Sắp hết",
      value: stats?.warrantyExpiringSoon || 0,
      color: "#f59e0b",
    },
    { name: "Hết hạn", value: stats?.warrantyExpired || 0, color: "#ef4444" },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return "Chào buổi sáng! Bắt đầu ngày mới hiệu quả.";
    if (h < 14) return "Chúc bạn buổi trưa vui vẻ!";
    if (h < 18) return "Buổi chiều tốt lành, tiếp tục phát huy nhé!";
    return "Buổi tối an lành, xem lại hoạt động hôm nay.";
  })();

  return (
    <div className="dashboard-container">
      <div className="page-fade-in">
        {/* Banner Section */}
        <div className="dashboard-banner-v2">
          <div className="banner-left">
            <div className="chip-neon">
              <ThunderboltOutlined /> LIVE SYSTEM
            </div>
            <Title
              level={1}
              className="m-0 text-white"
              style={{ color: "#ffffff" }}
            >
              Vinatech Asset Management
            </Title>
          </div>
          <Space className="sync-box" align="center">
            <div className="pulse-indicator"></div>
            <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
              {greeting}
            </span>
          </Space>
        </div>

        {/* 4 Cards Thống kê nhanh */}
        <Row gutter={[20, 20]} className="mb-6">
          {[
            {
              label: "TỔNG TÀI SẢN",
              val: stats?.totalAssets,
              color: "#06b6d4",
              icon: <AppstoreOutlined />,
              desc: "Thiết bị phần cứng",
            },
            {
              label: "BÀN GIAO THÁNG NÀY",
              val: stats?.monthlyAssignments,
              color: "#10b981",
              icon: <HistoryOutlined />,
              desc: "Lượt bàn giao mới",
            },
            {
              label: "VẬT TƯ TIÊU HAO SẮP HẾT",
              val: data?.consumables.length,
              color: "#ec4899",
              icon: <ExperimentOutlined />,
              desc: "Loại vật tư tiêu hao",
            },
            {
              label: "LICENSE CODE ĐÃ CẤP",
              val: stats?.totalLicenses,
              color: "#8b5cf6",
              icon: <FileTextOutlined />,
              desc: "Bản quyền phần mềm",
            },
          ].map((s, i) => (
            <Col xs={24} sm={12} xl={6} key={i}>
              <div className="page-fade-in">
                <Card
                  className="glass-stat-card"
                  hoverable
                  style={{ "--card-accent": s.color } as React.CSSProperties}
                >
                  <div className="stat-content">
                    <div className="stat-info">
                      <Text className="uppercase-label">{s.label}</Text>
                      <Title level={2} className="m-0">
                        <AnimatedNumber value={s.val ?? 0} />
                      </Title>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {s.desc}
                      </Text>
                    </div>
                    <div
                      className="stat-icon-v2"
                      style={{ background: `${s.color}12`, color: s.color }}
                    >
                      {s.icon}
                    </div>
                  </div>
                  <div
                    className="stat-card-bar"
                    style={{
                      background: `linear-gradient(90deg, ${s.color}40, ${s.color})`,
                    }}
                  />
                </Card>
              </div>
            </Col>
          ))}
        </Row>

        <div className="page-fade-in">
          <Row gutter={[24, 24]} style={{ marginTop: 32, marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <AppstoreOutlined style={{ color: "#10b981" }} /> Trạng thái
                    tài sản
                  </span>
                }
                className="glass-card-chart h-full-card"
              >
                <div className="donut-chart-wrapper">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <defs>
                        {assetStatusData.map((entry, index) => (
                          <linearGradient
                            key={`grad-${index}`}
                            id={`pieGrad-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={entry.color}
                              stopOpacity={1}
                            />
                            <stop
                              offset="100%"
                              stopColor={entry.color}
                              stopOpacity={0.7}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={assetStatusData}
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={800}
                      >
                        {assetStatusData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={`url(#pieGrad-${index})`}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: "none",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                          padding: "12px 16px",
                        }}
                        formatter={
                          ((value: any) => [
                            <span
                              key="v"
                              style={{ fontWeight: 700, color: "#1e293b" }}
                            >
                              {value}
                            </span>,
                          ]) as any
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <span className="center-val">{stats?.totalAssets}</span>
                    <span className="center-lbl">Tổng số</span>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card
                title={
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <FileTextOutlined style={{ color: "#3b82f6" }} /> Theo dõi
                    bảo hành thiết bị
                  </span>
                }
                className="glass-card-chart h-full-card"
              >
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={warrantyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <ReTooltip
                        cursor={{ fill: "rgba(59,130,246,0.04)", radius: 8 }}
                        contentStyle={{
                          borderRadius: 16,
                          border: "none",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                          padding: "12px 16px",
                        }}
                        formatter={
                          ((value: any) => [
                            <span
                              key="v"
                              style={{ fontWeight: 700, color: "#1e293b" }}
                            >
                              {value} thiết bị
                            </span>,
                          ]) as any
                        }
                      />
                      <Bar
                        dataKey="value"
                        radius={[8, 8, 0, 0]}
                        barSize={48}
                        animationDuration={1000}
                      >
                        {warrantyData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* HÀNG 2: BA DANH SÁCH CHI TIẾT (NẰM TRÊN 1 DẢI) */}
        <div className="page-fade-in">
          <Row gutter={[24, 24]}>
            {/* 1. Tình trạng License */}
            <Col xs={24} xl={7}>
              <Card
                title={
                  <>
                    <HistoryOutlined style={{ color: "#ef4444" }} /> Tình trạng
                    License
                  </>
                }
                className="glass-card-list h-full-card"
              >
                <div className="luxury-list scroll-styled">
                  {data?.licenses.map((lic, _) => {
                    const isExpired = lic.daysRemaining <= 0;
                    const isWarning =
                      lic.daysRemaining > 0 && lic.daysRemaining <= 30;
                    return (
                      <div className="page-fade-in">
                        <div className="item-header">
                          <Text
                            strong
                            style={{ color: "#334155", fontSize: 13 }}
                          >
                            {lic.name}
                          </Text>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: isExpired
                                ? "#fee2e2"
                                : isWarning
                                  ? "#fef3c7"
                                  : "#d1fae5",
                              color: isExpired
                                ? "#dc2626"
                                : isWarning
                                  ? "#d97706"
                                  : "#059669",
                            }}
                          >
                            {isExpired
                              ? "Hết hạn"
                              : `${lic.daysRemaining} ngày`}
                          </span>
                        </div>
                        <div className="item-sub-info">
                          <span className="uppercase-label">
                            Sử dụng: {lic.quantity}/{lic.minQuantity}
                          </span>
                          <span className="item-val-badge">
                            {Math.round((lic.quantity / lic.minQuantity) * 100)}
                            %
                          </span>
                        </div>
                        <div className="progress-bg">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min((lic.quantity / lic.minQuantity) * 100, 100)}%`,
                              background: isExpired
                                ? "#ef4444"
                                : "linear-gradient(90deg, #3b82f6, #06b6d4)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>

            {/* 2. Vật tư sắp hết */}
            <Col xs={24} xl={10}>
              <Card
                title={
                  <span>
                    <AlertOutlined style={{ color: "#f5222d" }} /> Cảnh báo vật
                    tư sắp hết
                  </span>
                }
                className="glass-card-list h-full-card"
              >
                <div className="luxury-list scroll-styled">
                  {data?.consumables.map((item, index) => {
                    // Thêm index vào đây
                    const isLow = item.quantity < item.minQuantity;
                    return (
                      /* Sử dụng kết hợp tên và index để tạo key duy nhất */
                      <div
                        className="page-fade-in"
                        key={`${item.name}-${index}`}
                      >
                        <div className="item-header">
                          <Text
                            strong
                            style={{ color: "#334155", fontSize: 13 }}
                          >
                            {item.name}
                          </Text>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: isLow ? "#fee2e2" : "#d1fae5",
                              color: isLow ? "#dc2626" : "#059669",
                            }}
                          >
                            {item.quantity} / {item.minQuantity}
                          </span>
                        </div>

                        <Progress
                          percent={Math.round(
                            (item.quantity / (item.minQuantity * 1.5)) * 100,
                          )}
                          status={isLow ? "exception" : "normal"}
                          strokeColor={isLow ? "#ef4444" : "#10b981"}
                          showInfo={false}
                          size={[undefined, 5] as any}
                          style={{ marginTop: 10 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>

            {/* 3. Phân loại thiết bị */}
            <Col xs={24} xl={7}>
              <Card
                title="Phân loại thiết bị phổ biến"
                className="glass-card-list h-full-card"
              >
                <div className="luxury-list scroll-styled">
                  {data?.topCategories.map((cat, i) => (
                    <div className="page-fade-in">
                      <div className="item-rank">{i + 1}</div>
                      <div
                        className="item-main"
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        <Text
                          strong
                          style={{
                            color: "#334155",
                            fontSize: 13,
                            display: "block",
                          }}
                        >
                          {cat.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {cat.count} thiết bị
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
