import axiosClient from '../axiosClient';

// 1. Định nghĩa Interface khớp với DB Locations tại VinaTech
export interface Location {
    id?: number;
    locationName: string;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
    isDeleted?: boolean;
}

export const locationService = {
    // Lấy toàn bộ danh sách vị trí/phòng ban
    getAll: async () => {
        return await axiosClient.get<Location[]>('Location');
    },

    // Lấy chi tiết một vị trí theo ID
    getById: async (id: number) => {
        return await axiosClient.get<Location>(`Location/${id}`);
    },

    // Khởi tạo vị trí mới
    create: async (data: Location) => {
        return await axiosClient.post<Location>('Location', data);
    },

    // Cập nhật thông tin vị trí
    update: async (id: number, data: Location) => {
        return await axiosClient.put(`Location/${id}`, data);
    },

    // Xóa vị trí (Soft Delete thông qua Controller)
    delete: async (id: number) => {
        return await axiosClient.delete(`Location/${id}`);
    }
};