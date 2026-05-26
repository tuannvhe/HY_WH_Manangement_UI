import { useState, useEffect, useRef } from "react";
import logoImg from "../src/assets/logoB.png";
import "./App.css";
import "./CSS/GlobalStyle.css";
import Dashboard from "./pages/Dashboard";
// @ts-ignore
import QrDetailPage from "./pages/QrDetailPage";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  RightOutlined,
  SettingOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BankOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Modal, Tag, message } from "antd";

import CategoryList from "./components/CategoryList";
import ModelList from "./components/ModelList";
import HardwareAssetList from "./components/HardwareAssetList";
import ConsumableList from "./components/ConsumableList";
import SoftwareLicenseList from "./components/SoftwareLicenseList";
import EmployeeList from "./components/EmployeeList";
import MaintenanceLogList from "./components/MaintenanceLogList";
import HandoverList from "./components/HandoverList";
import Chatbot from "./components/Chatbot";
import LoginPage from "./components/LoginPage";
import LocationList from "./components/LocationList";
import AssetAuditList from "./components/AssetAuditList";
import axiosClient from "./axiosClient";

message.config({ top: 100, duration: 3, maxCount: 3 });

// ── getLocCode helper (dùng chung) ────────────────────────────────────────────
function getLocCode(factoryCode: string) {
  if (!factoryCode) return "NA";
  const code = factoryCode.toUpperCase();
  if (code.includes("VVT_F1")) return "BN";
  if (code.includes("VVT_F3")) return "HN";
  if (code.includes("VVT_F4")) return "BG2";
  if (code.includes("VVT_F2")) return "BG1";
  if (code.includes("VVT_F5")) return "HY";
  return "NA";
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({
  user,
  open,
  onClose,
}: {
  user: any;
  open: boolean;
  onClose: () => void;
}) {
  //console.log("User data in ProfileModal:", user);
  const rows = [
    {
      icon: <IdcardOutlined />,
      label: "Mã nhân viên",
      value: user?.userId || "N/A",
    },
    {
      icon: <UserOutlined />,
      label: "Họ và tên",
      value: user?.fullName || "N/A",
    },
    {
      icon: <TeamOutlined />,
      label: "Phòng ban",
      value: user?.department || "N/A",
    },
    {
      icon: <BankOutlined />,
      label: "Nhà máy",
      value: user?.factoryCode || "N/A",
    },
    {
      icon: <EnvironmentOutlined />,
      label: "Vị trí",
      value: getLocCode(user?.factoryCode),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      centered
      closable={false}
      className="modal-3d-supreme"
      destroyOnHidden
    >
      <div className="modal-inner-3d">
        <div
          className="modal-top-decor"
          style={{ background: "linear-gradient(90deg, #7c3aed, #6366f1)" }}
        />
        <div className="modal-body-3d" style={{ padding: "44px 32px 32px" }}>
          {/* Avatar + tên */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                margin: "0 auto 12px",
                background: "linear-gradient(135deg, #cecbf6 0%, #afa9ec 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                border: "3px solid rgba(127,119,221,0.3)",
                boxShadow: "0 4px 16px rgba(99,75,183,0.2)",
              }}
            >
              👨‍💻
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>
              {user?.fullName || "N/A"}
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Tag color="purple">{user?.department || "EA Team"}</Tag>
              <Tag color="blue">{getLocCode(user?.factoryCode)}</Tag>
            </div>
          </div>

          {/* Thông tin dạng list */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {rows.map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 16px",
                  borderBottom:
                    idx < rows.length - 1 ? "1px solid #e2e8f0" : "none",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: "rgba(99,75,183,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6366f1",
                    fontSize: 14,
                  }}
                >
                  {row.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1e293b",
                      marginTop: 1,
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-cancel-3d"
            onClick={onClose}
            style={{ width: "100%", marginTop: 20, cursor: "pointer" }}
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── User Dropdown ─────────────────────────────────────────────────────────────
function UserDropdown({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menuItems = [
    {
      icon: <IdcardOutlined />,
      label: "Xem hồ sơ",
      color: "#6366f1",
      bg: "rgba(99,75,183,0.08)",
      onClick: () => {
        setMenuOpen(false);
        setProfileOpen(true);
      },
    },
    {
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      color: "#e24b4a",
      bg: "rgba(226,75,74,0.08)",
      onClick: () => {
        setMenuOpen(false);
        onLogout();
      },
    },
  ];

  return (
    <>
      {/* Chip trigger */}
      <div ref={wrapperRef} style={{ position: "relative" }}>
        <div
          className="user-chip"
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="user-avatar">👨‍💻</div>
          <div className="user-info">
            <div className="user-name">{user?.fullName || "NA"}</div>
            <div className="user-dept">{user?.department || "EA Team"}</div>
          </div>
          <div className="factory-pill">{getLocCode(user?.factoryCode)}</div>
          <span
            style={{
              fontSize: 11,
              color: "#b0a8e8",
              marginLeft: 2,
              display: "inline-flex",
              alignItems: "center",
              transition: "transform 0.2s",
              transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </div>

        {/* Dropdown */}
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 210,
              background: "#fff",
              border: "1px solid rgba(99,75,183,0.14)",
              borderRadius: 14,
              boxShadow:
                "0 8px 28px rgba(83,74,183,0.13), 0 2px 8px rgba(0,0,0,0.06)",
              zIndex: 300,
              overflow: "hidden",
              animation: "notif-slide-in 0.15s ease",
            }}
          >
            {/* Mini header */}
            {/* <div style={{
              padding: "12px 14px 10px",
              background: "linear-gradient(135deg, rgba(127,119,221,0.07), rgba(167,139,250,0.04))",
              borderBottom: "1px solid rgba(99,75,183,0.08)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#3c3489" }}>
                {user?.fullName || "NA"}
              </div>
              <div style={{ fontSize: 11, color: "#7f77dd", marginTop: 2 }}>
                {user?.department || "EA Team"} · {getLocCode(user?.factoryCode)}
              </div>
            </div> */}

            {/* Items */}
            {menuItems.map((item, idx) => (
              <div key={idx}>
                {idx > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: "rgba(0,0,0,0.06)",
                      margin: "0 10px",
                    }}
                  />
                )}
                <button
                  onClick={item.onClick}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: item.color,
                    fontWeight: 500,
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = item.bg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: item.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile modal */}
      <ProfileModal
        user={user}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}

// ── App chính ─────────────────────────────────────────────────────────────────
function App({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("vinatech_active_tab") || "dashboard",
  );
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => {
    const saved = localStorage.getItem("vinatech_menu_groups");
    return saved
      ? JSON.parse(saved)
      : { system: true, storage: true, history: true };
  });

  const TAB_LABELS: Record<string, { label: string; icon: string }> = {
    dashboard: { label: "Bảng điều khiển", icon: "🚀" },
    categories: { label: "Danh mục thiết bị", icon: "🗂️" },
    models: { label: "Thông số thiết bị", icon: "🏷️" },
    employees: { label: "Nhân sự hệ thống", icon: "👥" },
    locations: { label: "Vị trí & Phòng ban", icon: "📍" },
    assets: { label: "Danh sách tài sản", icon: "💻" },
    consumables: { label: "Vật tư tiêu hao", icon: "🔋" },
    licenses: { label: "Quản lý bản quyền", icon: "🔑" },
    handovers: { label: "Biên bản bàn giao", icon: "📄" },
    maintenance: { label: "Lịch sử bảo dưỡng", icon: "🛠️" },
    assetAudit: { label: "Kiểm kê thiết bị", icon: "🔍" },
  };

  const isGroupActive = (items: string[]) => items.includes(activeTab);

  useEffect(() => {
    localStorage.setItem("vinatech_active_tab", activeTab);
  }, [activeTab]);
  useEffect(() => {
    localStorage.setItem("vinatech_menu_groups", JSON.stringify(openGroups));
  }, [openGroups]);

  const toggleGroup = (group: string) => {
    if (collapsed) return;
    setOpenGroups((prev: any) => ({ ...prev, [group]: !prev[group] }));
  };

  const renderMenuItem = (id: string, icon: string, label: string) => (
    <button
      className={`menu-item ${activeTab === id ? "active" : ""}`}
      onClick={() => {
        setActiveTab(id);
        setMobileMenuOpen(false);
      }}
      title={collapsed ? label : ""}
    >
      <div className="menu-icon-3d">{icon}</div>
      {!collapsed && <span className="menu-text">{label}</span>}
    </button>
  );

  return (
    <div
      className={`app-layout ${collapsed ? "sidebar-collapsed" : ""} ${mobileMenuOpen ? "mobile-menu-open" : ""}`}
    >
      <Chatbot />

      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
      </button>
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-toggle-wrapper">
          <button
            className="collapse-btn-glass"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>
        <div className="sidebar-logo-container">
          <img src={logoImg} alt="Vinatech Logo" className="sidebar-logo-img" />
        </div>
        <nav className="sidebar-menu">
          {/* Hệ thống */}
          <div className="menu-section">
            {!collapsed && (
              <div
                className={`menu-group-header-3d ${isGroupActive(["dashboard", "categories", "models", "employees", "locations"]) ? "parent-active" : ""}`}
                onClick={() => toggleGroup("system")}
              >
                <div className="group-title-wrapper">
                  <div className="icon-box-3d">
                    <SettingOutlined />
                  </div>
                  <span className="group-text-3d">Hệ thống</span>
                </div>
                <div className="chevron-wrapper-3d">
                  {openGroups.system ? <DownOutlined /> : <RightOutlined />}
                </div>
              </div>
            )}
            {(openGroups.system || collapsed) && (
              <div className="menu-items-container">
                {renderMenuItem("dashboard", "🚀", "Bảng điều khiển")}
                {renderMenuItem("categories", "🗂️", "Danh mục thiết bị")}
                {renderMenuItem("models", "🏷️", "Thông số thiết bị")}
                {renderMenuItem("employees", "👥", "Nhân sự")}
                {renderMenuItem("locations", "📍", "Vị trí & phòng ban")}
              </div>
            )}
          </div>

          {/* Kho & Tài sản */}
          <div className="menu-section">
            {!collapsed && (
              <div
                className={`menu-group-header-3d ${isGroupActive(["assets", "consumables", "licenses"]) ? "parent-active" : ""}`}
                onClick={() => toggleGroup("storage")}
              >
                <div className="group-title-wrapper">
                  <div className="icon-box-3d">
                    <DatabaseOutlined />
                  </div>
                  <span className="group-text-3d">Kho & Tài sản</span>
                </div>
                <div className="chevron-wrapper-3d">
                  {openGroups.storage ? <DownOutlined /> : <RightOutlined />}
                </div>
              </div>
            )}
            {(openGroups.storage || collapsed) && (
              <div className="menu-items-container">
                {renderMenuItem("assets", "💻", "Thiết bị")}
                {renderMenuItem("consumables", "🔋", "Vật tư tiêu hao")}
                {renderMenuItem("licenses", "🔑", "Bản quyền")}
              </div>
            )}
          </div>

          {/* Lịch sử */}
          <div className="menu-section">
            {!collapsed && (
              <div
                className={`menu-group-header-3d ${isGroupActive(["handovers", "assetAudit", "maintenance"]) ? "parent-active" : ""}`}
                onClick={() => toggleGroup("history")}
              >
                <div className="group-title-wrapper">
                  <div className="icon-box-3d">
                    <HistoryOutlined />
                  </div>
                  <span className="group-text-3d">Lịch sử</span>
                </div>
                <div className="chevron-wrapper-3d">
                  {openGroups.history ? <DownOutlined /> : <RightOutlined />}
                </div>
              </div>
            )}
            {(openGroups.history || collapsed) && (
              <div className="menu-items-container">
                {renderMenuItem("handovers", "📄", "Biên bản bàn giao")}
                {/* {renderMenuItem("maintenance","🛠️", "Bảo dưỡng")} */}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* CỘT PHẢI */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <nav className="breadcrumb-3d">
              <span className="breadcrumb-item">🏠 Quản lý kho thiết bị</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item active">
                {TAB_LABELS[activeTab]?.label}
              </span>
            </nav>
          </div>

          <div className="topbar-actions">
            <UserDropdown user={user} onLogout={onLogout} />
          </div>
        </header>

        <main className="main-content">
          <div className="content-card">
            <div className="page-body">
              {activeTab === "dashboard" && <Dashboard />}
              {activeTab === "categories" && <CategoryList />}
              {activeTab === "models" && <ModelList />}
              {activeTab === "assets" && <HardwareAssetList />}
              {activeTab === "consumables" && <ConsumableList />}
              {activeTab === "licenses" && <SoftwareLicenseList />}
              {activeTab === "employees" && <EmployeeList />}
              {activeTab === "handovers" && <HandoverList />}
              {activeTab === "maintenance" && <MaintenanceLogList />}
              {activeTab === "locations" && <LocationList />}
              {activeTab === "assetAudit" && <AssetAuditList />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── AppWrapper ─────────────────────────────────────────────────────────────────
function AppWrapper() {
  const [isQrPage, setIsQrPage] = useState(false);
  const [user, setUser] = useState<any>(() => {
    const token = localStorage.getItem("vinatech_access_token");
    const userStr = localStorage.getItem("vinatech_user");
    if (token && userStr) return JSON.parse(userStr);
    return null;
  });

  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem("vinatech_access_token", userData.token);
    localStorage.setItem("vinatech_refresh_token", userData.refreshToken);
    localStorage.setItem("vinatech_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Xác nhận đăng xuất",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: "Bạn có chắc chắn muốn rời khỏi hệ thống không?",
      okText: "Đăng xuất",
      cancelText: "Hủy",
      centered: true,
      className: "logout-modal-3d",
      okButtonProps: {
        danger: true,
        style: { borderRadius: "8px", fontWeight: "bold" },
      },
      async onOk() {
        try {
          const rfToken = localStorage.getItem("vinatech_refresh_token");
          if (rfToken)
            await axiosClient.post("Auth/logout", { token: rfToken });
        } catch (e) {
          console.error("Server logout error", e);
        } finally {
          localStorage.clear();
          setUser(null);
          //window.location.href = "/login";
        }
      },
    });
  };

  useEffect(() => {
    const check = () =>
      setIsQrPage(window.location.hash.includes("#/qr-detail"));
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  if (isQrPage) return <QrDetailPage />;
  if (!user) return <LoginPage onLogin={handleLoginSuccess} />;
  return <App user={user} onLogout={handleLogout} />;
}

export default AppWrapper;
