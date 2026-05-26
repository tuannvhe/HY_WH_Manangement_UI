import axios, { type AxiosResponse } from 'axios';

import axiosClient from '../axiosClient';
export interface TransferAssetsDto {
    assetIds?: number[];
    licenseIds?: number[];
    fromEmployeeId: string;
    toEmployeeId: string;
    condition?: string;
    location: string;
}

export interface TransferConsumableDto {
    fromEmployeeId: string;
    toEmployeeId: string;
    items: {
        consumableId: number;
        quantity: number;
    }[];
}

export const assignmentService = {
    assign: (data: { assetId: number; employeeId: string; condition?: string; note?: string; deptId?: string; location?: string }) =>
        axiosClient.post(`${axiosClient.defaults.baseURL}Assignment/assign-asset`, data).then(res => res.data),

    assignMultiple: async (data: {
        licenseId: number;
        employeeIds: string[];
        condition?: string;
        deptId?: string;
        note?: string;
    }) => {
        return await axios.post(`${axiosClient.defaults.baseURL}Assignment/assign-multiple`, data);
    },

    revoke: (assetId: number | null, licenseId: number | null, employeeId: string | null, note: string) => {
        const params = new URLSearchParams();

        if (assetId) params.append('assetId', assetId.toString());
        if (licenseId) params.append('licenseId', licenseId.toString());

        // Thêm employeeId vào query params
        if (employeeId) params.append('employeeId', employeeId);

        params.append('note', note);
        //console.log('Revocation Params:', params.toString()); // Debug: Kiểm tra params trước khi gửi   
        // // Chèn thêm performer nếu backend yêu cầu, ví dụ lấy từ localStorage hoặc mặc định 'Admin'
        // params.append('performer', 'Admin'); 

        return axiosClient.post(`${axiosClient.defaults.baseURL}Assignment/revoke?${params.toString()}`);
    },

    transferAssets: async (data: TransferAssetsDto): Promise<AxiosResponse<any>> => {
        const res = await axiosClient.post('/Assignment/transfer', data);
        return res.data; // BẮT BUỘC phải return .data ở đây
    },
    transferConsumables: (payload: TransferConsumableDto) => {
        return axiosClient.post('Consumable/transfer', payload);
    },
    revokeConsumableBulk: (transactionIds: number[]) => {
        return axiosClient.post('Consumable/revoke-bulk', transactionIds);
    },
    revokeBulk: (payload: { assetIds: number[], licenseIds: number[], employeeId: string, note?: string }) => {
        return axiosClient.post('Assignment/revoke-bulk', payload);
    },
    revokeLicenseMultiple: (data: { 
        licenseId: number; 
        employeeIds: string[]; 
        note?: string 
    }) => {
        return axiosClient.post('Assignment/revoke-license-bulk', data).then(res => res.data);
    },
}

// Giả định service lấy danh sách nhân viên từ hệ thống
export const employeeService = {
   getLookupPaged: (searchTerm: string, pageNumber: number, pageSize: number = 20) => 
        axiosClient.get(`${axiosClient.defaults.baseURL}Employees/lookup-paged`, {
            params: { searchTerm, pageNumber, pageSize }
        }).then(res => res.data),
};
