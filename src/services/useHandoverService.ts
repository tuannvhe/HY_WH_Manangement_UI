import axiosClient from '../axiosClient';

export interface HandoverItem {
    id?: number;
    assetName: string;
    quantity: number;
    specification: string;
    currentStatus: string;
}

export interface HandoverReceipt {
    id: number;
    receiptNumber: string;
    handoverDate: string;
    senderName: string;
    senderDept: string;
    receiverId: string;
    receiverName: string;
    receiverDept: string;
    location: string;
    items: HandoverItem[];
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}

const BASE_PATH = 'Handover'; // Khớp với Route [Route("api/[controller]")] ở backend

export const handoverService = {
    getAll: async (searchTerm: string = '', page: number = 1, pageSize: number = 10) => {
        const res = await axiosClient.get<PagedResult<HandoverReceipt>>(BASE_PATH, {
            params: { searchTerm, page, pageSize }
        });
        return res.data;
    },

    getById: async (id: number) => {
        const res = await axiosClient.get<HandoverReceipt>(`${BASE_PATH}/${id}`);
        return res.data;
    },

    delete: async (id: number) => {
        const res = await axiosClient.delete(`${BASE_PATH}/${id}`);
        return res.data;
    },

    exportWord: async (id: number, receiptNo: string) => {
        const response = await axiosClient.get(`${BASE_PATH}/${id}/export-word`, {
            responseType: 'blob',
        });
        
        // Tạo link tải file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Đặt tên file theo số biên bản cho chuyên nghiệp
        const fileName = `Bien_Ban_Ban_Giao_${receiptNo.replace(/\//g, '-')}.docx`;
        link.setAttribute('download', fileName);
        
        document.body.appendChild(link);
        link.click();
        
        // Dọn dẹp bộ nhớ
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};