import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Typography, Space, Divider, Spin } from "antd";
import {
  SaveOutlined,
  FileTextOutlined,
  DesktopOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";
import {
  type IDomEditor,
  type IEditorConfig,
  type IToolbarConfig,
  i18nChangeLanguage,
} from "@wangeditor/editor";
import "@wangeditor/editor/dist/css/style.css";

i18nChangeLanguage("en");

const { Text } = Typography;

interface AssetNoteModalProps {
  visible: boolean;
  asset: any | null;
  onClose: () => void;
  onSave: (id: number, notes: string) => Promise<void>;
}

const AssetNoteModal: React.FC<AssetNoteModalProps> = ({
  visible,
  asset,
  onClose,
  onSave,
}) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Sử dụng Ref để theo dõi instance editor thực tế, tránh xung đột render
  const editorRef = useRef<IDomEditor | null>(null);

  const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
      "headerSelect",
      "bold",
      "underline",
      "italic",
      "color",
      "bgColor",
      "fontSize",
      "bulletedList",
      "numberedList",
      "todo",
      "insertLink",
    ],
  };

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: "Nhập nội dung ghi chú...",
    autoFocus: false,
  };

  // Reset nội dung khi asset thay đổi hoặc modal mở
  useEffect(() => {
    if (visible && asset) {
      setHtml(asset.note || "");
    }
  }, [visible, asset]);

  // QUAN TRỌNG: Xử lý Cleanup triệt để
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        setEditor(null);
      }
    };
  }, [visible]); // Chạy cleanup mỗi khi Modal đóng/mở

  const handleCreated = (ed: IDomEditor) => {
    editorRef.current = ed;
    setEditor(ed);
  };

  const handleInternalSave = async () => {
    if (!asset) return;
    setLoading(true);
    setGlobalLoading(true); // Khóa toàn màn hình
    try {
      await onSave(asset.id, html);
      onClose();
    } catch (error) {
      console.error("Lỗi lưu dữ liệu:", error);
    } finally {
      setLoading(false);
      setGlobalLoading(false); // Khóa toàn màn hình
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={850}
      centered
      destroyOnHidden
      className="modal-light-3d"
      closable={false}
      styles={{
        body: { padding: 0, borderRadius: "20px", overflow: "hidden" },
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center", // Giúp các icon và nút Đóng thẳng hàng
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Space size={14} align="start">
          <div className="header-icon-3d" style={{ marginTop: "4px" }}>
            <FileTextOutlined style={{ color: "#0f172a", fontSize: "22px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              HỒ SƠ GHI CHÚ
            </div>
            <Space
              split={<span style={{ color: "#cbd5e1" }}>|</span>}
              style={{ fontSize: "12px" }}
            >
              {/* <Text style={{ color: "#64748b", fontWeight: 600 }}>
                S/N:{" "}
                <span style={{ color: "#e21017", fontFamily: "monospace" }}>
                  {asset?.serial || "---"}
                </span>
              </Text> */}
              <Text style={{ color: "#64748b", fontWeight: 600 }}>
                TAG:{" "}
                <span style={{ color: "#2563eb" }}>
                  {asset?.assetTag || "---"}
                </span>
              </Text>
            </Space>
          </div>
        </Space>

        {/* <Button
          type="text"
          icon={<CloseOutlined style={{ fontSize: "14px" }} />}
          onClick={onClose}
          style={{
            background: "#f1f5f9",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        /> */}
      </div>

      <div style={{ padding: "24px", background: "#fff" }}>
        <div className="info-bar-3d">
          <div style={{ flex: 1 }}>
            <Text className="label-tiny">THIẾT BỊ</Text>
            <Text strong>
              <DesktopOutlined /> {asset?.modelName}
            </Text>
          </div>
          <Divider type="vertical" style={{ height: "40px" }} />
          <div style={{ flex: 1 }}>
            <Text className="label-tiny">SỐ SERIAL</Text>
            <Text strong>
              <ThunderboltOutlined style={{ color: "#f59e0b" }} />{" "}
              {asset?.serial || "N/A"}
            </Text>
          </div>
        </div>

        <div className="wangeditor-3d-wrapper">
          {/* Chỉ render Toolbar khi editor instance thực sự tồn tại trong state */}
          {editor && (
            <Toolbar
              editor={editor}
              defaultConfig={toolbarConfig}
              mode="default"
              style={{
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            />
          )}

          <Editor
            key={visible ? `editor-${asset?.id}` : "closed"} // Key động giúp ép re-mount sạch sẽ
            defaultConfig={editorConfig}
            value={html}
            onCreated={handleCreated}
            onChange={(ed) => setHtml(ed.getHtml())}
            mode="default"
            style={{ height: "350px", overflowY: "hidden" }}
          />
        </div>
      </div>

      <div className="modal-footer-3d">
        <Button onClick={onClose} className="btn-cancel-3d">
          HUỶ BỎ
        </Button>
        {globalLoading && (
          <div className="global-loading-overlay">
            <Spin size="large" tip="Đang lưu ghi chú..." />
          </div>
        )}
        <Button
          type="primary"
          loading={loading}
          onClick={handleInternalSave}
          icon={<SaveOutlined />}
          className="btn-submit-3d"
        >
          LƯU GHI CHÚ
        </Button>
      </div>
    </Modal>
  );
};

export default AssetNoteModal;
