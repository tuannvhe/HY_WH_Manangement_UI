import axios from 'axios';

const axiosClient = axios.create({
  //baseURL: 'http://localhost:5206/api/',
  //baseURL: 'http://192.168.3.100:5000/api/',
  baseURL: 'http://192.168.112.254:8008/api/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vinatech_access_token');
    const userStr = localStorage.getItem('vinatech_user');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.factoryCode) {
          config.headers['X-Factory-Code'] = user.factoryCode;
        }
      } catch (e) {
        console.error("Lỗi parse userStr", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('vinatech_refresh_token');
        const userStr = localStorage.getItem('vinatech_user');
        let factoryCode = '';
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            factoryCode = user.factoryCode || '';
          } catch (e) { /* ignore */ }
        }

        const response = await axios.post(
          axiosClient.defaults.baseURL + 'Auth/refresh',
          { token: refreshToken },
          { headers: { 'X-Factory-Code': factoryCode } }
        );

        const { token, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('vinatech_access_token', token);
        localStorage.setItem('vinatech_refresh_token', newRefreshToken);

        processQueue(null, token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;