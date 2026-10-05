import { api } from './api';

export const courseService = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/courses?${query}` : '/courses';
    const res = await api.get(endpoint);
    return res;
  },

  getById: async (id) => {
    const res = await api.get(`/courses/${id}`);
    return res;
  },

  create: async (data) => {
    const res = await api.post('/courses', data);
    return res;
  },

  update: async (id, data) => {
    const res = await api.patch(`/courses/${id}`, data);
    return res;
  },

  assignInstructors: async (id, instructorIds, action = 'set') => {
    const ids = Array.isArray(instructorIds) ? instructorIds : [instructorIds];
    const res = await api.post(`/courses/${id}/instructors`, { instructorIds: ids, action });
    return res;
  },

  assignInstructor: async (id, instructorId) => {
    const ids = Array.isArray(instructorId) ? instructorId : [instructorId];
    const res = await api.post(`/courses/${id}/instructors`, { instructorIds: ids, action: 'add' });
    return res;
  },

  manageInstructors: async (id, instructorIds, action = 'add') => {
    const res = await api.post(`/courses/${id}/instructors`, { instructorIds, action });
    return res;
  },

  manageStudents: async (id, studentIds, action = 'add') => {
    const res = await api.post(`/courses/${id}/students`, { studentIds, action });
    return res;
  },

  selfEnroll: async (id) => {
    const res = await api.post(`/courses/${id}/enroll`);
    return res;
  },

  archive: async (id) => {
    const res = await api.patch(`/courses/${id}/archive`);
    return res;
  },
};
