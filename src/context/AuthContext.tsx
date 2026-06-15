import React, { createContext, useState, useCallback, useEffect } from 'react';
import { User, LoginRequest } from '../features/auth/types';
import { authApi } from '../features/auth/services/authApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Synchronous helper to fetch stored session directly during state initialization
const getInitialAuthState = (): { user: User | null; token: string | null } => {
  const storedUser = localStorage.getItem('auth_user');
  const storedToken = localStorage.getItem('access_token');
  
  if (storedUser && storedToken) {
    try {
      return {
        user: JSON.parse(storedUser),
        token: storedToken,
      };
    } catch {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('access_token');
    }
  }
  return { user: null, token: null };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = getInitialAuthState();
  const [user, setUser] = useState<User | null>(initialAuth.user);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
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
      const response = await authApi.login(credentials);
      
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
