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

// Request Interceptor: Attach Authorization header if token exists
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global HTTP errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          // Unauthorized: Clear session and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('auth_user');
          
          // Only redirect if not already on the login page to prevent redirects loops
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?expired=true';
          }
          break;

        case 403:
          // Forbidden: Access Denied
          console.error('[API Error 403] Access Denied: Insufficient permissions.');
          // You could redirect to a specific 403 error page
          // window.location.href = '/403';
          break;

        case 500:
          // Internal Server Error
          console.error('[API Error 500] Internal Server Error: System malfunction.');
          alert('Hệ thống gặp sự cố. Vui lòng liên hệ quản trị viên hoặc thử lại sau.');
          break;

        default:
          console.error(`[API Error ${status}]`, error.response.data || error.message);
          break;
      }
    } else {
      console.error('[API Network Error] Connection refused or no response received.', error);
    }

    return Promise.reject(error);
  }
);
export default apiClient;
