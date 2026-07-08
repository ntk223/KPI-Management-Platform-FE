import React, { createContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { User, LoginRequest, UserRole } from '../features/auth/types';
import { authApi } from '../features/auth/services/authApi';
import { setAccessToken } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Phân tích lỗi từ axios / logic và trả về message tiếng Việt thân thiện.
 * Ưu tiên lấy `message` từ body ApiResponse của backend trước khi fallback.
 */
const parseLoginError = (err: unknown): string => {
  // Axios HTTP error – có response từ server
  if (axios.isAxiosError(err) && err.response) {
    const { status, data } = err.response;

    // Lấy message từ ApiResponse body nếu có
    const backendMessage: string | undefined =
      typeof data?.message === 'string' && data.message ? data.message : undefined;

    switch (status) {
      case 400:
        return backendMessage || 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.';
      case 401:
        return backendMessage || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      case 403:
        return backendMessage || 'Tài khoản của bạn không có quyền truy cập hệ thống.';
      case 423:
        return backendMessage || 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
      case 429:
        return 'Bạn đã thử quá nhiều lần. Vui lòng chờ vài phút rồi thử lại.';
      case 500:
      case 502:
      case 503:
        return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.';
      default:
        return backendMessage || `Đã xảy ra lỗi (${status}). Vui lòng thử lại.`;
    }
  }

  // Axios network error – không có response (server down / timeout / CORS)
  if (axios.isAxiosError(err) && !err.response) {
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return 'Kết nối quá thời gian chờ. Kiểm tra mạng và thử lại.';
    }
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }

  // Lỗi JavaScript thông thường (ví dụ: throw new Error('...'))
  if (err instanceof Error) return err.message;

  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Bắt đầu bằng true để kiểm tra token lúc khởi động
  const [error, setError] = useState<string | null>(null);

  // Silent Refresh khi khởi động ứng dụng
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          // Trình duyệt tự gửi cookie lên, gọi refresh-token để nhận accessToken mới
          const apiResponse = await authApi.refreshToken();
          if (apiResponse.success && apiResponse.data.accessToken) {
            setAccessToken(apiResponse.data.accessToken); // Lưu vào bộ nhớ tạm
            setUser(JSON.parse(storedUser));
          } else {
            localStorage.removeItem('auth_user');
          }
        } catch {
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // Đồng bộ hóa phiên làm việc trên các tab khác nhau
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
          setAccessToken(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const apiResponse = await authApi.login(credentials);

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Đăng nhập thất bại.');
      }

      const dto = apiResponse.data;

      // Lưu Access Token vào bộ nhớ tạm (Memory) thay vì localStorage
      setAccessToken(dto.accessToken);

      // Map LoginInfoDTO → User (chọn role mặc định ban đầu)
      const primaryRole: UserRole = dto.roles?.[0] ?? 'EMPLOYEE';
      const mappedUser: User = {
        username: dto.username,
        fullName: dto.fullName,
        email: dto.email,
        position: dto.position,
        roles: dto.roles,
        role: primaryRole,
        employeeId: dto.employeeId,
        department: dto.department,
      };

      localStorage.setItem('auth_user', JSON.stringify(mappedUser));
      setUser(mappedUser);
      return mappedUser;
    } catch (err: unknown) {
      const message = parseLoginError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Bỏ qua lỗi phía server, vẫn tiến hành xóa session phía client
    } finally {
      setAccessToken(null); // Giải phóng token khỏi bộ nhớ tạm
      localStorage.removeItem('auth_user');
      setUser(null);
      setError(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
