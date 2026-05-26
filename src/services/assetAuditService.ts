import axiosClient from '../axiosClient';

export interface AssetHealthDto {
  healthId: number;
  checkDate: string;
  batteryHealth: number;
  diskStatus: string;
  licenseStatus: string;
  partialKey: string;
  ipAddress: string;
  computerName: string;
  serial: string;
  assetTag: string;
  userName: string;
  department: string;
  employeeId: string;
  status: string;
  illegalApps: string;
  internalNote: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const assetAuditService = {
  // Lấy danh sách phân trang và lọc
  getPagedReport: async (params: any): Promise<PagedResult<AssetHealthDto>> => {
    // Lấy chi nhánh từ LocalStorage hoặc mặc định
    
    
    const response = await axiosClient.get(`${axiosClient.defaults.baseURL}AssetAudit/report`, {
      params
    });
    return response.data;
  }
};