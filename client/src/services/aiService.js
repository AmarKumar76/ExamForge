import { api } from './api';

export const aiService = {
  processMaterial: async (courseId, materialId) => {
    const res = await api.post(`/courses/${courseId}/ai/materials/${materialId}/process`);
    return res.data;
  },

  generateQuestions: async (courseId, config) => {
    const res = await api.post(`/courses/${courseId}/ai/generate-questions`, config);
    return res.data;
  },

  getQuestions: async (courseId, status = '', folderId = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (folderId) params.append('folderId', folderId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/courses/${courseId}/ai/questions${queryString}`);
    return res;
  },

  updateQuestion: async (questionId, payload) => {
    const res = await api.patch(`/ai/questions/${questionId}`, payload);
    return res.data;
  },

  approveQuestion: async (questionId) => {
    const res = await api.patch(`/ai/questions/${questionId}/approve`);
    return res.data;
  },

  bulkApproveQuestions: async (questionIds) => {
    const res = await api.post('/ai/questions/bulk-approve', { questionIds });
    return res.data;
  },

  rejectQuestion: async (questionId) => {
    const res = await api.patch(`/ai/questions/${questionId}/reject`);
    return res.data;
  },

  restoreQuestion: async (questionId) => {
    const res = await api.patch(`/ai/questions/${questionId}/restore`);
    return res.data;
  },

  bulkRejectQuestions: async (questionIds) => {
    const res = await api.post('/ai/questions/bulk-reject', { questionIds });
    return res.data;
  },

  deleteQuestion: async (questionId) => {
    const res = await api.delete(`/ai/questions/${questionId}`);
    return res.data;
  },
};
