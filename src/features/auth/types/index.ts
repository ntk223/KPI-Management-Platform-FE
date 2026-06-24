// User roles matching backend
export type UserRole = 'ADMIN' | 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE';

export interface Department {
  id: number;
  name: string;
  code?: string;
}

// User object stored in frontend state
export interface User {
  username: string;
  fullName: string;
  email: string;
  position: string;
  roles: UserRole[];
  role?: UserRole;
  employeeId?: number;
  department?: Department;
}

// ---- Request DTOs (match backend) ----

/** POST /auth/login */
export interface LoginRequest {
  username: string;
  password: string;
}

/** POST /auth/logout & POST /auth/refresh-token */
export interface RefreshTokenRequest {
  token: string;
}

// ---- Response DTOs (match backend ApiResponse<T>) ----

/** Generic wrapper returned by all backend endpoints */
export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

/** data field of POST /auth/login response (LoginInfoDTO) */
export interface LoginInfoDTO {
  username: string;
  fullName: string;
  email: string;
  position: string;
  roles: UserRole[];
  accessToken: string;
  refreshToken: string;
  employeeId?: number;
  department?: Department;
}

/** data field of POST /auth/refresh-token response (TokenResponse) */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ---- Frontend state ----

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
