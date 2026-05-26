import axiosClient from '../axiosClient';

export interface MaintenanceLog {
  id?: number;
  assetId: number;

  serviceDate: string;
  description: string;
  cost: number;
  technician?: string;
  replacementParts?: string;
  nextServiceDate?: string;
}

export interface GetMaintenanceLogParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface AssetLookup {
  id: number;
  assetTag: string;
  serial: string;
  modelName: string;
}

export const maintenanceLogService = {
  getAll: (params?: GetMaintenanceLogParams) => axiosClient.get('MaintenanceLog', { params }),
  getById: (id: number) => axiosClient.get(`MaintenanceLog/${id}`),
  create: (data: MaintenanceLog) => axiosClient.post('MaintenanceLog', data),
  update: (id: number, data: MaintenanceLog) => axiosClient.put(`MaintenanceLog/${id}`, data),
  delete: (id: number) => axiosClient.delete(`MaintenanceLog/${id}`),

  getAssetLookup: async (searchTerm?: string) => {
    return await axiosClient.get<AssetLookup[]>(`HardwareAssets/asset-lookup`, {
      params: { searchTerm }
    });
  }
};
