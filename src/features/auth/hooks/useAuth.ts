import { useState, useCallback, useEffect } from 'react';
import { LoginRequest, User } from '../types';
import { authApi } from '../services/authApi';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with localstorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    const storedToken = localStorage.getItem('access_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('access_token');
      }
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      
      // Store in localStorage
      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      setUser(response.user);
      return response.user;
    } catch (err: unknown) {
      const parsedError = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
      setError(parsedError);
      throw new Error(parsedError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    role: user?.role || null,
  };
};
