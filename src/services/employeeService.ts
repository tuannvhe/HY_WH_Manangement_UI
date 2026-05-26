import axiosClient from '../axiosClient';
    
export const employeeService = {
    getAll: (params: any) => axiosClient.get('/Employees/list', { params }),

    getAllocations: (employeeId: string) => 
        axiosClient.get(`Allocations/employee/${employeeId}`),

    revokeAssignment: (params: { assetId?: number; licenseId?: number; employeeId: string; note?: string }) => 
        axiosClient.post('Assignment/revoke', null, { params }),

    revokeConsumable: (transactionId: number) => 
        axiosClient.post(`Consumable/transactions/${transactionId}/revoke`),
    
    getLookupPaged: (searchTerm: string, pageNumber: number, pageSize: number = 20) => 
            axiosClient.get(`${axiosClient.defaults.baseURL}Employees/lookup-paged`, {
                params: { searchTerm, pageNumber, pageSize }
            }).then(res => res.data),
};