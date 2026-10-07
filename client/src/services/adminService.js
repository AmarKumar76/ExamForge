import { api } from './api';

export const adminService = {
  /**
   * Fetch real database analytics
   */
  getAnalytics: async () => {
    return api.get('/admin/analytics');
  },

  /**
   * Fetch real MongoDB counts for Audit Trail and System Events
   */
  getLogCounts: async () => {
    return api.get('/admin/audit/counts');
  },

  /**
   * Fetch paginated audit logs
   */
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/admin/audit-logs${queryString}`);
  },

  /**
   * Fetch paginated system logs
   */
  getSystemLogs: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/admin/system-logs${queryString}`);
  },
};

