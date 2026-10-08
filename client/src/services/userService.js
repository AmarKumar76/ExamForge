import { api } from './api';

export const userService = {
  /**
   * Get list of users with optional role, search, status, and institution filters
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.institutionId) params.append('institutionId', filters.institutionId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/users${queryString}`);
  },

  /**
   * Get single user detailed profile
   */
  getById: async (id) => {
    return api.get(`/users/${id}`);
  },

  /**
   * Create user account by admin (Student or Instructor)
   */
  create: async (userData) => {
    return api.post('/users', userData);
  },

  /**
   * Bulk import users from CSV/XLSX parsed dataset
   */
  bulkImport: async (payload) => {
    return api.post('/users/bulk-import', payload);
  },

  /**
   * Update user status (ACTIVE / SUSPENDED)
   */
  updateStatus: async (id, status) => {
    return api.patch(`/users/${id}/status`, { status });
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data) => {
    return api.put('/users/profile', data);
  },

  /**
   * Change current user password
   */
  changePassword: async (data) => {
    return api.put('/users/password', data);
  },

  /**
   * Update current user notification preferences
   */
  updatePreferences: async (data) => {
    return api.put('/users/preferences', data);
  },

  /**
   * Resend welcome email to a student or instructor
   */
  resendWelcomeEmail: async (id) => {
    return api.post(`/users/${id}/resend-welcome-email`);
  },
};
