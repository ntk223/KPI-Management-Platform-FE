import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Get API base URL from Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Lưu trữ Access Token trong bộ nhớ tạm (memory) để tránh tấn công XSS
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Cho phép đính kèm Cookie qua CORS
});

// Request Interceptor: Đính kèm Authorization header nếu có accessToken
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.withCredentials = true; // Đảm bảo mọi request đều gửi cookie nếu có
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Flag để ngăn chặn nhiều request refresh đồng thời
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Tự động refresh token khi gặp lỗi 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response) {
      console.error('[API Network Error] Connection refused or no response received.', error);
      return Promise.reject(error);
    }

    const { status } = error.response;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401: Hết hạn Access Token -> Gọi API refresh token
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Đưa request vào hàng đợi chờ refresh hoàn tất
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gửi request POST không có body vì token được lấy tự động từ HttpOnly Cookie
        const res = await axios.post<{
          success: boolean;
          data: { accessToken: string };
        }>(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { 
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true 
          },
        );

        const { accessToken: newAccessToken } = res.data.data;
        setAccessToken(newAccessToken); // Cập nhật Access Token trong bộ nhớ

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        localStorage.removeItem('auth_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403: Forbidden
    if (status === 403) {
      console.error('[API Error 403] Access Denied: Insufficient permissions.');
    }

    // 429: Too Many Requests (Rate Limit)
    if (status === 429) {
      const message = error.response.data?.message || 'Bạn đã thao tác quá nhanh. Vui lòng thử lại sau.';
      window.dispatchEvent(new CustomEvent('api-rate-limited', { detail: { message } }));
    }

    // 500: Internal Server Error
    if (status === 500) {
      console.error('[API Error 500] Internal Server Error: System malfunction.');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
