import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  message,
  Statistic,
  Input,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { auditService, type AuditLog } from "../services/useAuditService";
import "../CSS/GlobalStyle.css";

const { Title, Text } = Typography;

const AuditLogList: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [filterText, setFilterText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const fetchLogs = async (currentPage = 1, currentPageSize = 10) => {
    try {
      setLoading(true);
      const res = await auditService.getRecentLogs(
        currentPage,
        currentPageSize,
      );
      const payload = res.data as any;

      if (Array.isArray(payload)) {
        setLogs(payload);
        setTotal(payload.length);
      } else if (payload?.items) {
        setLogs(payload.items);
        setTotal(payload.total ?? payload.totalCount ?? payload.items.length);
      } else {
        setLogs(payload.data ?? []);
        setTotal(payload.total ?? payload.data?.length ?? 0);
      }
    } catch (err) {
      message.error("Không thể tải lịch sử audit. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, pageSize);
  }, [page, pageSize]);

  const handleSearch = () => setFilterText(searchText);

  const filteredLogs = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) =>
      [log.userId, log.type, log.tableName, log.primaryKey]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [logs, filterText]);

  const auditStats = useMemo(
    () => ({
      total: filteredLogs.length,
      create: filteredLogs.filter((log) => log.type === "Create").length,
      update: filteredLogs.filter((log) => log.type === "Update").length,
      delete: filteredLogs.filter((log) => log.type === "Delete").length,
    }),
    [filteredLogs],
  );

  const toggleRow = (record: AuditLog) => {
    setExpandedRowKeys((prev) =>
      prev.includes(record.id)
        ? prev.filter((key) => key !== record.id)
        : [...prev, record.id],
    );
  };

  const renderTypePill = (value: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      Create: { color: "#10b981", label: "TẠO" },
      Update: { color: "#3b82f6", label: "CẬP NHẬT" },
      Delete: { color: "#ef4444", label: "XÓA" },
    };
    const config = statusMap[value] ?? { color: "#64748b", label: value };
    return (
      <span
        className="type-pill-3d"
        style={{
          borderColor: config.color,
          color: config.color,
          background: `${config.color}16`,
        }}
      >
        <span className="dot" style={{ background: config.color }}></span>
        {config.label}
      </span>
    );
  };

  const stringifyDisplay = (value: unknown) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  //   const normalizeChangedColumns = (value?: unknown) => {
  //     if (value === undefined || value === null) return 'N/A';
  //     if (Array.isArray(value)) return value.join(', ');
  //     if (typeof value === 'string') {
  //       try {
  //         const parsed = JSON.parse(value);
  //         if (Array.isArray(parsed)) return parsed.join(', ');
  //       } catch {
  //         // ignore parse error
  //       }
  //       return value.replace(/\[|\]|\"/g, '');
  //     }
  //     return String(value);
  //   };

  const parseJsonValues = (oldValues?: unknown, newValues?: unknown) => {
    const parseValue = (value?: unknown) => {
      if (value === undefined || value === null) return null;
      if (typeof value === "object") return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }
      return null;
    };

    const oldObj = parseValue(oldValues);
    const newObj = parseValue(newValues);

    if (
      (oldObj && typeof oldObj === "object") ||
      (newObj && typeof newObj === "object")
    ) {
      const oldKeys =
        oldObj && typeof oldObj === "object" ? Object.keys(oldObj) : [];
      const newKeys =
        newObj && typeof newObj === "object" ? Object.keys(newObj) : [];
      const fields = Array.from(new Set([...oldKeys, ...newKeys]));
      return fields.map((field) => ({
        field,
        oldValue: stringifyDisplay(
          oldObj && typeof oldObj === "object" ? (oldObj as any)[field] : null,
        ),
        newValue: stringifyDisplay(
          newObj && typeof newObj === "object" ? (newObj as any)[field] : null,
        ),
      }));
    }

    return [
      { field: "Trước", oldValue: stringifyDisplay(oldValues), newValue: "" },
      { field: "Sau", oldValue: "", newValue: stringifyDisplay(newValues) },
    ];
  };

  const detailColumns = [
    {
      title: "Trường",
      dataIndex: "field",
      key: "field",
      width: 220,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Giá trị",
      dataIndex: "value",
      key: "value",
      render: (value: string) => (
        <div className="auditlog-value-cell">{value || "N/A"}</div>
      ),
    },
  ];

  const changeColumns = [
    {
      title: "Trường",
      dataIndex: "field",
      key: "field",
      width: 220,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Giá trị cũ",
      dataIndex: "oldValue",
      key: "oldValue",
      render: (value: string) => (
        <div className="auditlog-value-cell">{value}</div>
      ),
    },
    {
      title: "Giá trị mới",
      dataIndex: "newValue",
      key: "newValue",
      render: (value: string) => (
        <div className="auditlog-value-cell">{value}</div>
      ),
    },
  ];

  const columns = [
    {
      title: "NGÀY GIỜ",
      dataIndex: "dateTime",
      key: "dateTime",
      render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm:ss"),
      sorter: (a: AuditLog, b: AuditLog) =>
        dayjs(a.dateTime).unix() - dayjs(b.dateTime).unix(),
      width: 180,
    },
    {
      title: "NGƯỜI THỰC HIỆN",
      dataIndex: "userId",
      key: "userId",
      width: 180,
    },
    {
      title: "BẢNG",
      dataIndex: "tableName",
      key: "tableName",
      width: 180,
    },
    {
      title: "HÀNH ĐỘNG",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (value: string) => renderTypePill(value),
    },
    // {
    //   title: 'KHÓA CHÍNH',
    //   dataIndex: 'primaryKey',
    //   key: 'primaryKey',
    //   width: 180,
    //   render: (value: string) => <Text code>{value}</Text>,
    // },
    {
      title: "CHI TIẾT",
      key: "action",
      align: "right" as const,
      width: 140,
      render: (record: AuditLog) => (
        <Space>
          <Button type="text" onClick={() => toggleRow(record)}>
            {expandedRowKeys.includes(record.id) ? "Thu gọn" : "Xem chi tiết"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-page-container auditlog-page">
      <div className="page-fade-in">
        <div className="bento-header-wrapper">
          <div className="bento-card welcome-banner">
            <div className="banner-content">
              <div className="banner-badge">
                <ThunderboltOutlined /> AUDIT TRAIL
              </div>
              <Title level={1} className="banner-title">
                Lịch sử hệ thống
              </Title>
              <Text className="banner-subtitle">
                Theo dõi mọi thay đổi và thao tác dữ liệu trong hệ thống.
              </Text>
            </div>
          </div>

          {/* <div className="bento-card stat-card">
            <Statistic title="Tổng bản ghi" value={auditStats.total} prefix={<FileTextOutlined />} />
            <div className="stat-progress" style={{ background: '#8b5cf6' }}></div>
          </div> */}
          <div className="bento-card stat-card">
            <Statistic
              title="Tạo mới"
              value={auditStats.create}
              prefix={<RiseOutlined />}
            />
            <div
              className="stat-progress"
              style={{ background: "#10b981" }}
            ></div>
          </div>
          <div className="bento-card stat-card">
            <Statistic
              title="Cập nhật"
              value={auditStats.update}
              prefix={<CheckCircleOutlined />}
            />
            <div
              className="stat-progress"
              style={{ background: "#3b82f6" }}
            ></div>
          </div>
          <div className="bento-card stat-card">
            <Statistic
              title="Xóa"
              value={auditStats.delete}
              prefix={<FileTextOutlined />}
            />
            <div
              className="stat-progress"
              style={{ background: "#ef4444" }}
            ></div>
          </div>
        </div>

        <div className="table-perspective-container">
          <Card
            className="glass-table-card-3d auditlog-card"
            variant="borderless"
          >
            <div className="table-header-3d auditlog-header">
              <div className="search-engine-3d">
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Tìm kiếm theo người, bảng, hành động..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={handleSearch}
                  allowClear
                  variant="borderless"
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
              <div className="sync-status">
                <span className="pulse-dot"></span>
                LIVE AUDIT STREAM
              </div>
            </div>

            <Table
              className="auditlog-table"
              columns={columns}
              dataSource={filteredLogs}
              loading={loading}
              rowKey="id"
              expandable={{
                expandedRowKeys,
                expandIconColumnIndex: -1,
                expandIcon: () => null,
                onExpand: (_expanded, record) => toggleRow(record),
                expandedRowRender: (record: AuditLog) => {
                  const summaryData = [
                    { field: "Người thực hiện", value: record.userId },
                    { field: "Hành động", value: record.type },
                    { field: "Tên bảng", value: record.tableName },
                  ];
                  return (
                    <div className="auditlog-expanded-row">
                      <div className="auditlog-summary-block">
                        <Title level={5} className="auditlog-section-title">
                          Thông tin cơ bản
                        </Title>
                        <Table
                          columns={detailColumns}
                          dataSource={summaryData}
                          pagination={false}
                          rowKey="field"
                          size="small"
                        />
                      </div>
                      <div className="auditlog-changes-block">
                        <Title level={5} className="auditlog-section-title">
                          Chi tiết thay đổi
                        </Title>
                        <Table
                          columns={changeColumns}
                          dataSource={parseJsonValues(
                            record.oldValues,
                            record.newValues,
                          )}
                          pagination={false}
                          rowKey="field"
                          size="small"
                        />
                      </div>
                    </div>
                  );
                },
                rowExpandable: () => true,
              }}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                onChange: (current, size) => {
                  setPage(current);
                  setPageSize(size || 10);
                  setExpandedRowKeys([]);
                },
                showTotal: (totalValue) => (
                  <Text strong>{`Tổng ${totalValue} bản ghi`}</Text>
                ),
              }}
              rowClassName="glass-row-3d auditlog-row"
              scroll={{ x: 1000 }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditLogList;
