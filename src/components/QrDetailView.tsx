import React from 'react';
import { Button, Card, Popconfirm, Tag, Typography, Divider, Space } from 'antd';
import {
  InboxOutlined,
  UserOutlined,
  WarningOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  ShareAltOutlined,
  RetweetOutlined,
  CalendarOutlined,
  SolutionOutlined,
  MessageOutlined,
  TagOutlined,
  GroupOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { HardwareAsset } from '../services/useHardwareAssetService';

const { Title, Text } = Typography;

interface QrDetailViewProps {
  asset: HardwareAsset | null;
  scannedText: string;
  scanError?: string | null;
  onRetry?: () => void;
  onRevoke?: (asset: HardwareAsset) => void; 
  onAssign?: (asset: HardwareAsset) => void;
  actionLoading?: boolean;
  isMobile?: boolean;
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'In Use': { label: 'Đang sử dụng', color: '#3b82f6', icon: <UserOutlined /> },
  'In Storage': { label: 'Lưu kho', color: '#10b981', icon: <InboxOutlined /> },
  'Broken': { label: 'Hỏng / Lỗi', color: '#ef4444', icon: <WarningOutlined /> },
  'Maintenance': { label: 'Đang bảo trì', color: '#f59e0b', icon: <ToolOutlined /> },
};

const QrDetailView: React.FC<QrDetailViewProps> = ({
  asset,
  scanError,
  onRetry,
  onRevoke,
  onAssign,
  actionLoading,
  isMobile
}) => {
  const statusInfo = asset
    ? statusMap[asset.status] || { label: asset.status, color: '#64748b', icon: <InfoCircleOutlined /> }
    : null;

  return (
    <Card className="qr-detail-card" styles={{ body: { padding: isMobile ? 20 : 32 } }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#3b82f6', padding: '8px', borderRadius: '12px' }}>
          <ToolOutlined style={{ color: '#fff', fontSize: 24 }} />
        </div>
        <Title level={4} style={{ margin: 0, letterSpacing: -0.5 }}>
          CHI TIẾT THIẾT BỊ
        </Title>
      </div>

      {scanError && (
        <div style={{ textAlign: 'center', padding: '40px 0', background: '#fff7e6', borderRadius: 16 }}>
          <WarningOutlined style={{ fontSize: 48, color: '#faad14' }} />
          <div style={{ marginTop: 16 }}><Text strong style={{ fontSize: 16 }}>{scanError}</Text></div>
          {onRetry && <Button type="primary" shape="round" onClick={onRetry} style={{ marginTop: 16 }}>Thử lại</Button>}
        </div>
      )}

      {asset && (
        <div className="qr-detail-content">
          <div className="qr-detail-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Title level={5} style={{ margin: 0, fontSize: isMobile ? 18 : 22 }}>{asset.modelName}</Title>
              <Text type="secondary"><TagOutlined /> {asset.assetTag}</Text>
            </div>
            {statusInfo && (
              <Tag 
                color={statusInfo.color} 
                icon={statusInfo.icon} 
                className={asset.status === 'In Use' ? 'pulse-tag' : ''}
                style={{ padding: '6px 16px', borderRadius: 20, fontWeight: 700, border: 'none' }}
              >
                {statusInfo.label.toUpperCase()}
              </Tag>
            )}
          </div>

          <Divider style={{ margin: '24px 0' }} />

          <div className="qr-detail-properties">
            <div className="qr-detail-row">
              <span className="qr-detail-key"><SolutionOutlined /> Số Serial</span>
              <span className="qr-detail-value">{asset.serial || 'N/A'}</span>
            </div>
            
            <div className="qr-detail-row">
              <span className="qr-detail-key"><UserOutlined /> Nhân sự sử dụng </span>
              <span className="qr-detail-value" style={{ color: asset.assignedTo ? '#3b82f6' : '#bfbfbf' }}>
                {asset.assignedTo || 'Chưa bàn giao'}
              </span>
            </div>

          <div className="qr-detail-row">
              <span className="qr-detail-key"><GroupOutlined /> Phòng ban</span>
              <span className="qr-detail-value" style={{ color: asset.assignedDept ? '#0e6f0c' : '#bfbfbf' }}>
                {asset.assignedDept || '---'}
              </span>
            </div>

            <div className="qr-detail-row">
              <span className="qr-detail-key"><CalendarOutlined /> Bảo hành đến</span>
              <span className="qr-detail-value">
                {asset.warrantyExpiry ? dayjs(asset.warrantyExpiry).format('DD/MM/YYYY') : '---'}
              </span>
            </div>

            <div className="qr-detail-row" style={{ border: 'none', background: '#f9fafb', padding: '12px', borderRadius: '12px', marginTop: 8 }}>
              <span className="qr-detail-key"><MessageOutlined /> Ghi chú</span>
              <span className="qr-detail-value" style={{ textAlign: 'left', flex: 1, marginLeft: 20 }}>
                {asset.note ? (
                  <div dangerouslySetInnerHTML={{ __html: asset.note }} style={{ color: '#4b5563' }} />
                ) : "Không có ghi chú"}
              </span>
            </div>
          </div>

          <div style={{ 
            marginTop: 40, 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: 16 
          }}>
            {/* THU HỒI */}
            {asset.status === 'In Use' && onRevoke && (
              <Popconfirm
                title="Xác nhận thu hồi?"
                onConfirm={() => onRevoke(asset)}
                okText="Thu hồi"
                cancelText="Hủy"
                okButtonProps={{ danger: true, size: 'large' }}
              >
                <Button 
                  danger 
                  type="primary" 
                  icon={<RetweetOutlined />} 
                  block={isMobile}
                  size="large"
                  className="btn-3d-revoke"
                  loading={actionLoading}
                >
                  Thu hồi thiết bị
                </Button>
              </Popconfirm>
            )}

            {/* GÁN NHÂN SỰ */}
            {!isMobile && asset.status === 'In Storage' && onAssign && (
              <Button
                type="primary"
                icon={<ShareAltOutlined />}
                onClick={() => onAssign(asset)}
                size="large"
                style={{ 
                  backgroundColor: '#10b981', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                Bàn giao nhân sự
              </Button>
            )}

            {isMobile && asset.status === 'In Storage' && (
              <div style={{ 
                textAlign: 'center', 
                width: '100%', 
                padding: '16px', 
                background: 'linear-gradient(to right, #f0fdf4, #dcfce7)', 
                borderRadius: '15px',
                border: '1px solid #bbf7d0'
              }}>
                <Space>
                  <InboxOutlined style={{ color: '#16a34a' }} />
                  <Text style={{ color: '#166534', fontWeight: 600 }}>Sẵn sàng bàn giao (Dùng PC)</Text>
                </Space>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default QrDetailView;