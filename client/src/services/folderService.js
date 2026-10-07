import { api } from './api';

export const folderService = {
  getFolders: async (courseId) => {
    const res = await api.get(`/courses/${courseId}/folders`);
    return res.data;
  },

  createFolder: async (courseId, folderData) => {
    const res = await api.post(`/courses/${courseId}/folders`, folderData);
    return res.data;
  },

  updateFolder: async (folderId, folderData) => {
    const res = await api.patch(`/folders/${folderId}`, folderData);
    return res.data;
  },

  deleteFolder: async (folderId) => {
    const res = await api.delete(`/folders/${folderId}`);
    return res;
  },

  moveQuestion: async (questionId, targetFolderId) => {
    const res = await api.post('/folders/move-question', { questionId, targetFolderId });
    return res.data;
  },

  bulkMoveQuestions: async (questionIds, targetFolderId) => {
    const res = await api.post('/folders/bulk-move', { questionIds, targetFolderId });
    return res.data;
  },
};
