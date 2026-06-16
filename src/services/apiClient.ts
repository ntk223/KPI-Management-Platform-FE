import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Get API base URL from Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Authorization header if access_token exists
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Flag to prevent multiple simultaneous refresh attempts
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

// Response Interceptor: Handle global HTTP errors & auto token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response) {
      console.error('[API Network Error] Connection refused or no response received.', error);
      return Promise.reject(error);
    }

    const { status } = error.response;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401: Try refresh-token flow once, then redirect to login
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token available – clear session and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until refresh completes
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
        const res = await axios.post<{
          success: boolean;
          data: { accessToken: string; refreshToken: string };
        }>(
          `${API_BASE_URL}/auth/refresh-token`,
          { token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
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

    // 500: Internal Server Error
    if (status === 500) {
      console.error('[API Error 500] Internal Server Error: System malfunction.');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
