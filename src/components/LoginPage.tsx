import React, { useState } from 'react';
import { UserOutlined, LockOutlined, ArrowRightOutlined, BankOutlined } from '@ant-design/icons';
import { message, Spin } from 'antd';
import logoImg from '../assets/logoB.png'; // Đảm bảo đường dẫn đúng
import '../CSS/Login.css';
import axiosClient from '../axiosClient'; // Sử dụng axiosClient đã cấu hình sẵn

interface LoginProps {
  onLogin: (userData: any) => void;
}
const getLocCode = (factoryCode: string) => {
  if (!factoryCode) return 'NA';
  const code = factoryCode.toUpperCase();
  if (code.includes('VVT_F1')) return 'Bắc Ninh';
  if (code.includes('VVT_F3')) return 'Hà Nam';
  if (code.includes('VVT_F4')) return 'Bắc Giang #2';
  if (code.includes('VVT_F2')) return 'Bắc Giang #1';
  if (code.includes('VVT_F5')) return 'Hưng Yên';
  return 'NA';
};
const LoginPage: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [factoryCode, setFactoryCode] = useState('VVT_F1');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(axiosClient.defaults.baseURL + 'Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, factoryCode })
      });

      if (response.ok) {
        const data = await response.json();
        message.success(`${data.fullName} (${getLocCode(data.factoryCode)}) - Đăng nhập thành công!`);
        onLogin(data); // Lưu thông tin vào AppWrapper
      } else {
        message.error('Sai tài khoản, mật khẩu hoặc chi nhánh!');
      }
    } catch (error) {
      message.error('Không thể kết nối đến server. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="login-loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner-wrapper">
              <Spin size="large" />
            </div>
            <h2 className="loading-title">ĐANG ĐĂNG NHẬP...</h2>
            <p className="loading-subtitle">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      )}

      <div className="login-container">
        <div className="bg-glow blob-1"></div>
        <div className="bg-glow blob-2"></div>

        <div className="login-card-3d">
          <div className="login-glass-overlay"></div>

          <div className="login-content">
            <div className="login-header">
              <div className="logo-wrapper-3d">
                <img src={logoImg} alt="Vinatech Logo" className="login-logo" />
              </div>
              <h1 className="login-title">Hệ Thống Quản Lý</h1>
              <p className="login-subtitle">Vinatech Vina - Smart Warehouse</p>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              {/* Chi nhánh */}
              <div className="input-group-3d">
                <BankOutlined className="input-icon" />
                <select
                  className="factory-select-custom"
                  value={factoryCode}
                  onChange={(e) => setFactoryCode(e.target.value)}
                >
                  <option value="VVT_F1">Bắc Ninh - Bắc Giang</option>
                  <option value="VVT_F3">Hà Nam</option>
                  <option value="VVT_F5">Hưng Yên</option>
                </select>
              </div>

              {/* Tài khoản */}
              <div className="input-group-3d">
                <UserOutlined className="input-icon" />
                <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Mật khẩu */}
              <div className="input-group-3d">
                <LockOutlined className="input-icon" />
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="login-btn-3d" disabled={loading}>
                <span>{loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}</span>
                {!loading && <ArrowRightOutlined className="btn-icon" />}
              </button>
            </form>

            <div className="login-footer">
              <p> 2026 Viet Nam EA Team - Vinatech Vina</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;