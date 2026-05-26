import axiosClient from '../axiosClient';

export interface Category {
  id?: number;
  name: string;
  type: string;
  depreciationMonths: number;
  description?: string;
}

export const categoryService = {
  getAll: () => axiosClient.get<Category[]>('Categories'),
  getById: (id: number) => axiosClient.get<Category>(`Categories/${id}`),
  create: (data: Category) => axiosClient.post('Categories', data),
  update: (id: number, data: Category) => axiosClient.put(`Categories/${id}`, data),
  delete(id: number | string) {
    return axiosClient.delete(`Categories/${id}`);
  }
};