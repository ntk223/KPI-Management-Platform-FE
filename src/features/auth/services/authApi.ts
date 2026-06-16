import apiClient from '../../../services/apiClient';
import {
  ApiResponse,
  LoginInfoDTO,
  LoginRequest,
  RefreshTokenRequest,
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
   * Gửi refreshToken để server invalidate session
   */
  logout: async (refreshToken: string): Promise<void> => {
    const body: RefreshTokenRequest = { token: refreshToken };
    await apiClient.post<ApiResponse<string>>('/auth/logout', body);
  },

  /**
   * POST /auth/refresh-token
   * Gửi refreshToken, nhận accessToken + refreshToken mới
   */
  refreshToken: async (token: string): Promise<ApiResponse<TokenResponse>> => {
    const body: RefreshTokenRequest = { token };
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      '/auth/refresh-token',
      body,
    );
    return response.data;
  },
};
