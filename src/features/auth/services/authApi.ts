// import { httpClient } from '../../../services';
import { LoginRequest, LoginResponse, User } from '../types';

export const authApi = {
  /**
   * Triggers the user login API request.
   * Leverages mock delay and conditions for local prototyping and development.
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Real implementation:
    // return httpClient.post<LoginResponse>('/auth/login', credentials);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!credentials.email || credentials.email.includes('error')) {
          return reject(new Error('Tài khoản hoặc mật khẩu không chính xác.'));
        }

        // Dynamically assign role based on email prefix for demo purposes
        let role: 'ADMIN' | 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE' = 'MANAGER';
        let name = 'Trần Minh Quang';
        let avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80';

        const emailLower = credentials.email.toLowerCase();
        if (emailLower.startsWith('admin')) {
          role = 'ADMIN';
          name = 'Nguyễn Hoàng Hải (Admin)';
          avatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80';
        } else if (emailLower.startsWith('director')) {
          role = 'DIRECTOR';
          name = 'Phạm Thế Vinh (Director)';
          avatar = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80';
        } else if (emailLower.startsWith('employee')) {
          role = 'EMPLOYEE';
          name = 'Nguyễn Thu Thảo (Employee)';
          avatar = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80';
        }

        resolve({
          accessToken: 'mock-jwt-web-token-123456789-signature',
          tokenType: 'Bearer',
          user: {
            id: 'mock-uid-' + Math.random().toString(36).substring(2, 9),
            name,
            email: credentials.email,
            role,
            avatar,
          },
        });
      }, 1200);
    });
  },

  /**
   * Retrieves current authenticated user details from accessToken.
   */
  getCurrentUser: async (): Promise<User> => {
    // Real implementation:
    // return httpClient.get<User>('/auth/me');

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'mock-uid-default',
          name: 'Trần Minh Quang',
          email: 'quang.tm@kpi-corp.vn',
          role: 'MANAGER',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        });
      }, 800);
    });
  },
};
