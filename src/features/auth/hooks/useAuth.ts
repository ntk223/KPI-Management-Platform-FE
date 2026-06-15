import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';

/**
 * Custom hook to access global authentication state.
 * Consumes the shared AuthContext provider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
