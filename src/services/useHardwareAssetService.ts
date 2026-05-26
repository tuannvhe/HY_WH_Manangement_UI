
import axiosClient from '../axiosClient';

export interface HardwareAsset {
  id?: number;
  assetTag: string;
  serial: string;         // Khớp với Entity Serial
  modelId: number;
  modelName?: string;
  categoryName?: string;
  vendorId?: number;
  vendorName?: string;
  status: string;
  purchasePrice: number;  // Khớp với Entity PurchasePrice
  purchaseDate?: string;
  warrantyMonths: number; // Dùng để BE tính toán WarrantyExpiry
  location?: string;
  note?: string;
  warrantyExpiry?: string;          // Khớp với Entity Note (số ít)
  assignedTo?: string;
  assignedToId?: string; // Mã nhân viên được gán, dùng để hiển thị trong danh sách
  assignedDept?: string;   // Tên phòng ban được gán, dùng để hiển thị trong danh sách
  specs?: string;
}

export interface HardwareAssetQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
}

export interface HardwareAssetPagedResponse {
  items: HardwareAsset[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  statInUse?: number;
  statInStorage?: number;
}

export const hardwareAssetService = {
  getAll: (params?: HardwareAssetQueryParams) =>
    axiosClient.get<HardwareAssetPagedResponse>('HardwareAssets', { params }),

  getById: (id: number) => 
    axiosClient.get<HardwareAsset>(`HardwareAssets/${id}`),

  create: (data: HardwareAsset) => 
    axiosClient.post<HardwareAsset>('HardwareAssets', data),

  update: (id: number, data: HardwareAsset) => 
    axiosClient.put(`HardwareAssets/${id}`, data),

  updateNote: (id: number, note: string) =>
    axiosClient.patch(`HardwareAssets/${id}/note`, { note }),

  delete: (id: number) => 
    axiosClient.delete(`HardwareAssets/${id}`)
};