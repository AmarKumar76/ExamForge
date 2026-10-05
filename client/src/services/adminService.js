import { api } from './api';

export const adminService = {
  /**
   * Fetch real database analytics
   */
  getAnalytics: async () => {
    return api.get('/admin/analytics');
  },

  /**
   * Fetch audit logs
   */
  getAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/admin/audit-logs${queryString}`);
  },

  /**
   * Fetch system logs
   */
  getSystemLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.level) params.append('level', filters.level);
    if (filters.module) params.append('module', filters.module);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/admin/system-logs${queryString}`);
  },
};
