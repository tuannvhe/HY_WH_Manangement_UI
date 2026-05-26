import axiosClient from '../axiosClient';

export interface AuditLog {
  id: number;
  userId: string;
  type: string;
  tableName: string;
  dateTime: string;
  oldValues?: unknown;
  newValues?: unknown;
  affectedColumns?: string;
  primaryKey: string;
}

export const auditService = {
  getRecentLogs: (page: number, pageSize: number) =>
    axiosClient.get<AuditLog[]>('Audit', { params: { page, pageSize } }),

  getLogDetail: (id: number) => axiosClient.get<AuditLog>(`Audit/${id}`),
};
