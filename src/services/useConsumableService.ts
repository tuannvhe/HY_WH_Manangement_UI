
import axiosClient from '../axiosClient'; // Thay đổi theo Port của bạn

export interface Consumable {
  id?: number;
  name: string;
  categoryId: string;
  categoryName?: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  location: string;
  note?: string;
}
export interface GetBatchParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
}
export interface ConsumableTransaction {
  consumableId: number;
  transactionType: 'In' | 'Out';
  quantity: number;
  employeeId?: string;
  referenceNo?: string;
}

export const consumableService = {
  getAll: async (params?: any) => {
    const mappedParams = {
      searchTerm: params?.searchTerm || '',
      employeeCode: params?.employeeCode || '',
      page: params?.page || 1,
      pageSize: params?.pageSize || 8 // Đồng bộ với tên biến trong ConsumableList
    };
    // Đảm bảo URL là 'Consumable' (số ít) nếu Swagger của bạn định nghĩa thế
    return await axiosClient.get('Consumable', { params: mappedParams });
  },

  // Các hàm khác nên viết gọn lại như sau:
  getById: (id: number) => axiosClient.get(`Consumable/${id}`),
  create: (data: any) => axiosClient.post('Consumable', data),
  update: (id: number, data: any) => axiosClient.put(`Consumable/${id}`, data),
  delete: (id: number) => axiosClient.delete(`Consumable/${id}`),
  getCategories: () => axiosClient.get('Categories/lookup-hardware'),
  getIssueHistory: async (id: number, params?: any) => {
    const mappedParams = {
      search: params?.searchTerm || '', // Map lại cho khớp với [FromQuery] search ở C#
      page: params?.page || 1,
      pageSize: params?.pageSize || 10
    };
    // SỬA: Dùng dấu huyền ` và biến ${id}
    return await axiosClient.get(`Consumable/history/${id}`, { params: mappedParams });
  },
  revokeTransaction: async (transactionId: number) => {
    return await axiosClient.post(`Consumable/transactions/${transactionId}/revoke`);
  },
  getEmployeesLookup: async () => {
    return await axiosClient.get('Employees/lookup');
  },
  executeTransaction: (transaction: any) =>
    axiosClient.post('Consumable/transaction', transaction)
};