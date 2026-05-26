import axiosClient from '../axiosClient';

export interface Vendor {
    id: number;
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxCode?: string;
}

export interface CreateVendorDto {
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxCode?: string;
}

export const vendorService = {
    // Ép kiểu trả về là AxiosResponse chứa mảng Vendor
    getAll: () => axiosClient.get<Vendor[]>('Vendors'),
    getById: (id: number) => axiosClient.get<Vendor>(`Vendors/${id}`),

    // Gửi trực tiếp data (không dùng { data })
    create: (data: CreateVendorDto) => axiosClient.post<Vendor>('Vendors', data),

    update: (id: number, data: CreateVendorDto) => axiosClient.put(`Vendors/${id}`, data),
    delete: (id: number) => axiosClient.delete(`Vendors/${id}`),
};