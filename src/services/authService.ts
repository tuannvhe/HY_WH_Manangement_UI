import axiosClient from '../axiosClient'; // Import file bạn vừa viết
import type { LoginResponse } from '../types/auth.types';

export const authService = {
    login: async (credentials: any): Promise<LoginResponse> => {
        // AxiosClient đã có interceptor, nên gọi thẳng
        const response = await axiosClient.post('/auth/login', credentials);
        return response.data;
    },

    // Hàm này ít khi dùng vì interceptor đã xử lý tự động, 
    // nhưng để lại nếu bạn cần refresh chủ động
    refresh: async (refreshToken: string) => {
        const response = await axiosClient.post('/auth/refresh', { token: refreshToken });
        return response.data;
    },

    logout: async () => {
        localStorage.clear();
        window.location.href = '/login';
    }
};