import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table, Button, Input, Card, Typography, DatePicker,
  Space, Row, Col, Statistic, Tag, message,
  Tooltip,
  Badge
} from 'antd';
import {
  SearchOutlined, DesktopOutlined,
  UserOutlined, TeamOutlined, CalendarOutlined,
  FilterOutlined, ReloadOutlined, FileProtectOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { assetAuditService, type AssetHealthDto } from '../services/assetAuditService';
import '../CSS/GlobalStyle.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AssetAuditList: React.FC = () => {
  const [data, setData] = useState<AssetHealthDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // State quản lý các bộ lọc
  const [filters, setFilters] = useState({
    pageIndex: 1,
    pageSize: 10,
    search: '',
    dept: '',
    user: '',
    from: null as any,
    to: null as any
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {
        pageIndex: filters.pageIndex,
        pageSize: filters.pageSize,
        search: filters.search || null,
        dept: filters.dept || null,
        user: filters.user || null,
        from: filters.from ? filters.from.format('YYYY-MM-DD HH:mm:ss') : null,
        to: filters.to ? filters.to.format('YYYY-MM-DD HH:mm:ss') : null,
      };

      const res = await assetAuditService.getPagedReport(queryParams);
      setData(res.items);
      setTotal(res.totalCount);
    } catch (err) {
      message.error("Không thể kết nối máy chủ dữ liệu Audit");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [filters.pageIndex, filters.pageSize]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, pageIndex: 1 }));
    loadData();
  };

  const columns = useMemo(() => [
    {
      title: 'THIẾT BỊ / HỆ THỐNG',
      key: 'device',
      width: 250,
      render: (record: AssetHealthDto) => (
        <div className="asset-info-cell-3d">
          <div className="icon-box-3d"><DesktopOutlined /></div>
          <div className="text-group">
            <Text strong className="name-3d">{record.computerName}</Text>
            <div className="sub-path">
              <Tag color="blue" style={{ margin: 0, fontSize: '10px' }}>{record.serial}</Tag>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'NGƯỜI SỬ DỤNG',
      key: 'user',
      width: 200,
      render: (record: AssetHealthDto) => (
        <div className="user-info-group">
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: '#1890ff' }}><UserOutlined /> {record.userName.trim()}</Text>
            <Text style={{ fontSize: '12px' }}>
              <TeamOutlined /> {record.department} (ID: {record.employeeId})
            </Text>
          </Space>
        </div>
      ),
    },
    {
      title: 'SECURITY AUDIT',
      key: 'security',
      width: 400,
      render: (record: any) => {
        const apps = record.illegalApps?.split(';').filter((a: string) => a.trim() !== "") || [];

        const tooltipContent = (
          
          // Tăng width ở đây (ví dụ 450px hoặc 500px tùy nhu cầu)
          <div style={{ padding: '12px', width: '450px', maxHeight: '500px', overflowY: 'auto' }}>
            <div style={{
              marginBottom: '18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="pulse-icon" style={{ fontSize: '18px' }}>🚀</div>
                <Text strong style={{
                  color: '#fff',
                  fontSize: '14px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #fff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Phát hiện vi phạm
                </Text>
              </div>

              {/* TAG HIỂN THỊ SỐ LOGS CHUYÊN NGHIỆP */}
              <div style={{
                background: 'rgba(255, 77, 79, 0.1)',
                border: '1px solid rgba(255, 77, 79, 0.25)',
                padding: '4px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 10px rgba(255, 77, 79, 0.1)'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ff4d4f',
                  boxShadow: '0 0 8px #ff4d4f',
                  display: 'inline-block'
                }}></span>
                <Text style={{ color: '#ff4d4f', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {apps.length} INCIDENTS
                </Text>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {apps.map((app: string, i: number) => {
                let color = "#94a3b8";
                let label = "INFO";
                let icon = "🛡️";
                let bgColor = "rgba(148, 163, 184, 0.05)";
                const upperApp = app.toUpperCase();

                if (upperApp.includes('[ALERT-APP]')) {
                  color = "#ff4d4f"; label = "CRITICAL"; icon = "🚫"; bgColor = "rgba(255, 77, 79, 0.08)";
                } else if (upperApp.includes('[ALERT-HASH]') || upperApp.includes('[ALERT-TASK]')) {
                  color = "#f97316"; label = "THREAT"; icon = "🔍"; bgColor = "rgba(249, 115, 22, 0.08)";
                } else if (upperApp.includes('[WARN-UNAPPROVED]')) {
                  color = "#eab308"; label = "WARNING"; icon = "⚠️"; bgColor = "rgba(234, 179, 8, 0.05)";
                }

                return (
                  <div key={i} style={{
                    background: bgColor,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${color}33`, // Màu viền mờ 20%
                    borderLeft: `4px solid ${color}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Label nhỏ định danh loại lỗi */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      padding: '2px 8px',
                      fontSize: '9px',
                      fontWeight: 900,
                      color: '#fff',
                      background: color,
                      borderBottomLeftRadius: '6px',
                      opacity: 0.8
                    }}>
                      {label}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{icon}</span>
                      <Text style={{
                        color: color,
                        fontSize: '12px',
                        lineHeight: '1.6',
                        fontFamily: "'Fira Code', 'Roboto Mono', monospace",
                        wordBreak: 'break-all',
                        flex: 1
                      }}>
                        {app.trim()}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

        return (
          <Tooltip
            title={tooltipContent}
            color="#1d1d1d" // Antd sẽ tự lo màu background và màu cái mũi tên (arrow)
            overlayInnerStyle={{
              padding: 0,           // CỰC KỲ QUAN TRỌNG: Loại bỏ khoảng trắng thừa
              width: 'fit-content', // Tự động co giãn theo div 450px của bạn
              borderRadius: '12px',
              overflow: 'hidden'    // Đảm bảo các item bên trong không tràn qua góc bo
            }}
          >
            <div style={{ cursor: 'pointer' }}>
              {apps.length > 0 ? (
                <Space>
                  <Badge count={apps.length} status="error" />
                  <Text type="danger" strong style={{ fontSize: '12px' }}>
                    {apps[0].length > 45 ? `${apps[0].substring(0, 45)}...` : apps[0]}
                  </Text>
                </Space>
              ) : (
                <Tag color="success">Secure</Tag>
              )}
            </div>

          </Tooltip>
        );
      }
    },
    {
      title: 'HỆ THỐNG',
      key: 'sys_status',
      render: (record: any) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.diskStatus === 'Healthy' ? 'green' : 'volcano'} style={{ width: '100%' }}>
            DISK: {record.diskStatus}
          </Tag>
          <Tag color="cyan" style={{ width: '100%' }}>LIC: {record.licenseStatus}</Tag>
        </Space>
      )
    },
    {
      title: 'THỜI GIAN',
      dataIndex: 'checkDate',
      render: (date: string) => (
        <div className="time-cell" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
          <CalendarOutlined /> {dayjs(date).format('DD/MM/YYYY')}
          <div style={{ color: '#0b6af1', marginLeft: '16px' }}>{dayjs(date).format('HH:mm:ss')}</div>
        </div>
      )
    }
  ], []);

  return (
    <div className="glass-page-container">
      <div className="page-fade-in">

        {/* BENTO HEADER */}
        <div className="bento-header-wrapper">
          <div className="bento-card welcome-banner">
            <div className="banner-content">
              <div className="banner-badge"><FileProtectOutlined /> IT AUDIT REAL-TIME</div>
              <Title level={1} className="banner-title">Asset Health Reports</Title>
              <Text className="banner-subtitle">Dữ liệu kiểm tra định kỳ từ Agent Vinatech</Text>
            </div>
            <Button
              type="primary"
              className="btn-submit-3d"
              icon={<ReloadOutlined />}
              onClick={() => loadData()}
              style={{ width: '160px' }}
            > LÀM MỚI </Button>
          </div>

          <div className="bento-card stat-card hardware">
            <Statistic title="Tổng báo cáo" value={total} prefix={<HistoryOutlined style={{ color: '#06b6d4' }} />} />
            <div className="stat-progress" style={{ background: '#06b6d4' }}></div>
          </div>
        </div>

        {/* BỘ LỌC NÂNG CAO (ADVANCED FILTERS) */}
        <Card className="glass-table-card-3d" style={{ marginBottom: '24px', border: 'none' }}>
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} md={5}>
              <Text strong><SearchOutlined /> Serial / Asset Tag</Text>
              <Input
                className="input-3d"
                placeholder="Tìm Serial máy..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} md={5}>
              <Text strong><TeamOutlined /> Phòng ban</Text>
              <Input
                className="input-3d"
                placeholder="Lọc phòng ban..."
                value={filters.dept}
                onChange={e => setFilters({ ...filters, dept: e.target.value })}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} md={9}>
              <Text strong><CalendarOutlined /> Khoảng thời gian</Text>
              <RangePicker
                className="input-3d"
                style={{ width: '100%' }}
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                onChange={(dates: any) => {
                  setFilters({
                    ...filters,
                    from: dates ? dates[0] : null,
                    to: dates ? dates[1] : null
                  });
                }}
              />
            </Col>
            <Col xs={24} md={5}>
              <Button
                type="primary"
                block
                size="large"
                icon={<FilterOutlined />}
                className="btn-submit-3d"
                onClick={handleSearch}
                loading={loading}
              > LỌC KẾT QUẢ 
              </Button>
            </Col>
          </Row>
        </Card>

        {/* BẢNG DỮ LIỆU 3D PERSPECTIVE */}
        <div className="table-perspective-container">
          <Card className="glass-table-card-3d" variant="borderless">
            <Table
              columns={columns}
              dataSource={data}
              pagination={{
                current: filters.pageIndex,
                pageSize: filters.pageSize,
                total: total,
                onChange: (page, size) => setFilters({ ...filters, pageIndex: page, pageSize: size }),
                showSizeChanger: true,
                //pageSizeOptions: ['8', '20', '50'],
                showTotal: (total) => <Text strong style={{ color: '#64748b' }}>Tìm thấy {total} bản ghi</Text>
              }}
              loading={loading}
              rowKey="healthId"
              className="custom-table-3d"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssetAuditList;