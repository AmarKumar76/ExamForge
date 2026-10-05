import { api } from './api';

export const institutionService = {
  getAll: async () => {
    const res = await api.get('/institutions');
    return res;
  },

  getById: async (id) => {
    const res = await api.get(`/institutions/${id}`);
    return res;
  },

  create: async (data) => {
    const res = await api.post('/institutions', data);
    return res;
  },

  update: async (id, data) => {
    const res = await api.patch(`/institutions/${id}`, data);
    return res;
  },

  addDepartment: async (id, department) => {
    const res = await api.post(`/institutions/${id}/departments`, { department });
    return res;
  },

  archive: async (id) => {
    const res = await api.patch(`/institutions/${id}/archive`);
    return res;
  },
};
