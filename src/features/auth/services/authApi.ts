import apiClient from '../../../services/apiClient';
import {
  ApiResponse,
  LoginInfoDTO,
  LoginRequest,
  TokenResponse,
} from '../types';

export const authApi = {
  /**
   * POST /auth/login
   * Gửi username + password, nhận LoginInfoDTO kèm accessToken & refreshToken
   */
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginInfoDTO>> => {
    const response = await apiClient.post<ApiResponse<LoginInfoDTO>>(
      '/auth/login',
      credentials,
    );
    return response.data;
  },

  /**
   * POST /auth/logout
   * Yêu cầu xóa session trên server và xóa Cookie chứa refresh token
   */
  logout: async (): Promise<void> => {
    await apiClient.post<ApiResponse<string>>('/auth/logout');
  },

  /**
   * POST /auth/refresh-token
   * Gửi yêu cầu làm mới access token, trình duyệt tự gửi kèm cookie chứa refresh token
   */
  refreshToken: async (): Promise<ApiResponse<TokenResponse>> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      '/auth/refresh-token'
    );
    return response.data;
  },
};
