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
   * Create user account by admin
   */
  create: async (userData) => {
    return api.post('/users', userData);
  },

  /**
   * Update user status (ACTIVE / SUSPENDED)
   */
  updateStatus: async (id, status) => {
    return api.patch(`/users/${id}/status`, { status });
  },
};
