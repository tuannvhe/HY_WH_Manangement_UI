import axiosClient from '../axiosClient';

// 1. Định nghĩa Interface
export interface SoftwareLicense {
  id: number;
  softwareName: string;
  productKey?: string;
  vendorName?: string;
  vendorId?: number; // Thêm vendorId để map với Form
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
  expiryDate?: string;
  isSubscription: boolean;
  status: string;
  username?: string;
  password?: string;
}

export interface CreateUpdateLicenseDto {
  softwareName: string;
  productKey?: string;
  vendorId?: number;
  totalSeats: number;
  expiryDate?: string | null;
  isSubscription: boolean;
}

// Interface cho tham số phân trang
export interface QueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  expiryFilter?: string,
  seatFilter?: string
}

// Interface cho cấu trúc trả về từ Server (Paging Result)
export interface PagingResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
export interface LicenseUsageDto {
  assignmentId: number;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeDepartment: string;
  transactionDate: string;
  condition: string;
}

export const softwareLicenseService = {
  // Cập nhật getAll để hỗ trợ Server-side Params
  getAll: (params?: QueryParams) => {
    return  axiosClient.get<PagingResponse<SoftwareLicense>>(
      'SoftwareLicense',
      { params } // Axios sẽ tự biến {pageNumber: 1} thành ?pageNumber=1
    );
  },

  // Lấy chi tiết 1 License
  getById: (id: number) => {
    return axiosClient.get<SoftwareLicense>(`SoftwareLicense/${id}`);
  },

  // Thêm mới License
  create: (data: CreateUpdateLicenseDto) => {
    return axiosClient.post<SoftwareLicense>('SoftwareLicense', data);
  },

  // Cập nhật License
  update: (id: number, data: CreateUpdateLicenseDto) => {
    return axiosClient.put(`SoftwareLicense/${id}`, data);
  },

  // Xóa License
  delete: (id: number) => {
    return axiosClient.delete(`SoftwareLicense/${id}`);
  },
  getUsage: (licenseId: number, params: { page: number; pageSize: number; search?: string }) => {
    return axiosClient.get<PagingResponse<LicenseUsageDto>>(
      `SoftwareLicense/license/${licenseId}/usage`,
      {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search
        }
      }
    );
  },

};