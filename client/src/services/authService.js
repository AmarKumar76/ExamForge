import { api } from './api';

export const authService = {
  /**
   * Register a new user account
   * POST /api/v1/auth/register
   */
  register: async ({ name, email, password, role }) => {
    return await api.post('/auth/register', { name, email, password, role });
  },

  /**
   * Login user with credentials
   * POST /api/v1/auth/login
   */
  login: async ({ email, password }) => {
    return await api.post('/auth/login', { email, password });
  },

  /**
   * Fetch authenticated user profile
   * GET /api/v1/auth/me
   */
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  /**
   * Request password reset instructions
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  /**
   * Submit new password with reset token
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async ({ token, password }) => {
    return await api.post('/auth/reset-password', { token, password });
  },
};
