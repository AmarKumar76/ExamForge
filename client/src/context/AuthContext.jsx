import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useTheme } from './ThemeContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { setActiveRole } = useTheme();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('examforge_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on initial app load
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('examforge_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data?.user) {
          const authenticatedUser = response.data.user;
          setUser(authenticatedUser);
          if (authenticatedUser.role) {
            const roleKey = authenticatedUser.role.toLowerCase().replace('_admin', '');
            setActiveRole(roleKey === 'super' ? 'admin' : roleKey === 'institution' ? 'admin' : roleKey);
          }
        } else {
          // Token invalid or expired
          localStorage.removeItem('examforge_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session restoration failed:', err.message);
        localStorage.removeItem('examforge_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Handle Login
  const login = async ({ email, password }) => {
    const response = await authService.login({ email, password });
    if (response.success && response.data) {
      const { user: authUser, token: authToken } = response.data;
      localStorage.setItem('examforge_token', authToken);
      setToken(authToken);
      setUser(authUser);

      if (authUser.role) {
        const roleKey = authUser.role.toLowerCase().replace('_admin', '');
        setActiveRole(roleKey === 'super' ? 'admin' : roleKey === 'institution' ? 'admin' : roleKey);
      }

      return authUser;
    }
    throw new Error(response.message || 'Login failed.');
  };

  // Handle Registration (Creates account only, does NOT auto-login or store JWT)
  const register = async ({ name, email, password, role }) => {
    localStorage.removeItem('examforge_token');
    setToken(null);
    setUser(null);

    const response = await authService.register({ name, email, password, role });
    if (response.success && response.data) {
      return response.data.user;
    }
    throw new Error(response.message || 'Registration failed.');
  };

  // Handle Logout
  const logout = () => {
    localStorage.removeItem('examforge_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
