
// Định nghĩa Interface dựa trên Entity Model và ModelDto từ Backend
export interface ModelDto {
  id?: number;
  categoryId: number;
  modelName: string;
  manufacturer?: string;
  specs?: string;
  imageURL?: string;
}

import axiosClient from '../axiosClient';

export const modelService = {
  // 1. GET: api/Models
  getAll: async () => {
    return await axiosClient.get<ModelDto[]>('Models');
  },

  // 2. GET: api/Models/5
  getById: async (id: number) => {
    return await axiosClient.get<ModelDto>(`Models/${id}`);
  },

  // 3. POST: api/Models
  create: async (data: ModelDto) => {
    return await axiosClient.post<ModelDto>('Models', data);
  },

  // 4. PUT: api/Models/5
  update: async (id: number, data: ModelDto) => {
    return await axiosClient.put(`Models/${id}`, data);
  },

  // 5. DELETE: api/Models/5
  delete: async (id: number) => {
    return await axiosClient.delete(`Models/${id}`);
  }
};