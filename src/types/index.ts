export interface Asset {
  id: number;
  assetTag: string;
  serial: string;
  modelName: string;
  status: 'Sẵn sàng' | 'Đang sử dụng' | 'Đang sửa chữa' | 'Thanh lý';
  purchaseDate: string;
  warrantyExpiry: string;
}

export interface AssignmentRequest {
  assetId: number;
  employeeId: number;
  deptId: number;
  actionDate: string;
  note: string;
}

export interface Vendor {
  id: number;
  name: string;
}

export interface Model {
  id: number;
  modelName: string;
  manufacturer: string;
}

export interface AssetInput {
  serial: string;
  modelId: number;
  vendorId: number;
  purchasePrice: number;
  purchaseDate: string;
  warrantyExpiry: string;
  contractNo: string;
  note: string;
}