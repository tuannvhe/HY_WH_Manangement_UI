import { useEffect, useState } from 'react';
import { hardwareAssetService, type HardwareAsset } from '../services/useHardwareAssetService';
import QrDetailView from '../components/QrDetailView';
import { Modal, Spin, Typography, message } from 'antd';
import { assignmentService } from '../services/assignmentService';
import { CheckCircleFilled } from '@ant-design/icons';

const parseHashQuery = () => {
  const hash = window.location.hash || '';
  const queryStart = hash.indexOf('?');
  return new URLSearchParams(queryStart >= 0 ? hash.slice(queryStart) : '');
};

const QrDetailPage: React.FC = () => {
  const [asset, setAsset] = useState<HardwareAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannedText, setScannedText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Nhận diện thiết bị di động để giới hạn tính năng
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const loadAsset = async () => {
    setLoading(true);
    setError(null);
    const hashParams = parseHashQuery();
    const assetId = hashParams.get('assetId');
    const assetTag = hashParams.get('assetTag');

    // Accept QR payload that is plain text (no URL), e.g.:
    // assetId=1\nassetTag=ABC\nserial=...\nspecs=...
    // When a scanner pastes the text into hash, we can parse by newline/\n too.
    const rawHash = (window.location.hash || '').replace(/^#/, '');
    const rawText = rawHash.replace(/^\?/, '');
    const lines = rawText.split(/\n/).map((s) => s.trim()).filter(Boolean);
    const kv: Record<string, string> = {};
    for (const line of lines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx < 0) continue;
      const k = line.slice(0, eqIdx).trim();
      const v = line.slice(eqIdx + 1).trim();
      kv[k] = v;
    }

    const serial = kv['serial'] ?? '';
    const specs = kv['specs'] ?? '';

    setScannedText(
      [
        assetId ? `assetId=${assetId}` : null,
        assetTag ? `assetTag=${assetTag}` : null,
        serial ? `serial=${decodeURIComponent(serial)}` : null,
        specs ? `specs=${decodeURIComponent(specs)}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    );


    try {
      if (assetId) {
        const response = await hardwareAssetService.getById(Number(assetId));
        setAsset(response.data);
      } else if (assetTag) {
        const response = await hardwareAssetService.getAll();
        const match = response.data.items?.find((item: any) =>
          item.assetTag?.toLowerCase().trim() === assetTag.toLowerCase().trim()
        );
        if (match) setAsset(match);
        else setError('Không tìm thấy thiết bị với mã tag này trong hệ thống.');
      } else {
        setError('Dữ liệu quét không hợp lệ hoặc thiếu thông tin.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAsset(); }, []);

  // Hàm thu hồi nhận vào asset (Giải quyết lỗi TS 2322)
  const handleRevoke = async (targetAsset: HardwareAsset) => {
    if (!targetAsset) return;
    setActionLoading(true);
    try {
      const assignedToId = targetAsset.assignedToId || targetAsset.assignedTo || null;

      await assignmentService.revoke(
        targetAsset.id!,
        null,
        assignedToId,
        ""
      );

      // Thay thế message.success bằng Modal thông báo hiện đại
      Modal.success({
        title: <span style={{ color: '#52c41a', fontWeight: 700, fontSize: '18px' }}>THU HỒI THÀNH CÔNG</span>,
        centered: true, // Quan trọng cho Mobile: Đưa thông báo ra giữa màn hình
        icon: <CheckCircleFilled style={{ color: '#52c41a', fontSize: '24px' }} />,
        width: isMobile ? '90%' : 400, // Co giãn theo thiết bị
        content: (
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary">Thiết bị:</Typography.Text>
              <Typography.Text strong style={{ marginLeft: 8, color: '#1890ff', fontSize: '16px' }}>
                {targetAsset.modelName}
              </Typography.Text>
            </div>

            <div style={{
              padding: '12px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <Typography.Text style={{ color: '#389e0d' }}>
                Trạng thái đã được cập nhật thành <b>Lưu kho</b>
              </Typography.Text>
            </div>
          </div>
        ),
        okText: 'Xác nhận',
        okButtonProps: {
          size: 'large',
          style: {
            width: isMobile ? '100%' : 'auto',
            borderRadius: '8px',
            height: '45px',
            fontWeight: 600
          }
        },
        // Tự động đóng sau khi người dùng bấm hoặc thao tác xong
        maskClosable: true,
      });

      await loadAsset();
    } catch (err) {
      message.error("Không thể thực hiện thu hồi lúc này.");
    } finally {
      setActionLoading(false);
    }
  };

  // const handleAssign = (targetAsset: HardwareAsset) => {
  //   if (isMobile) return;
  //   // Chuyển hướng về trang danh sách tài sản và mở modal gán (ví dụ)
  //   window.location.href = `/#/assets?assignId=${targetAsset.id}`;
  // };

  return (
    <div className="glass-page-container" style={{ padding: '24px', minHeight: '100vh', background: '#f4f7fe' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="Đang truy xuất dữ liệu thiết bị..." />
          </div>
        ) : (
          <QrDetailView
            asset={asset}
            scannedText={scannedText}
            scanError={error}
            onRetry={loadAsset}
            onRevoke={handleRevoke}
            //onAssign={!isMobile ? handleAssign : undefined}
            actionLoading={actionLoading}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
};

export default QrDetailPage;