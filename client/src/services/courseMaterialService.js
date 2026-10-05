import { api } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const courseMaterialService = {
  getByCourse: async (courseId) => {
    const res = await api.get(`/courses/${courseId}/materials`);
    return res;
  },

  getById: async (id) => {
    const res = await api.get(`/materials/${id}`);
    return res;
  },

  upload: async (courseId, formData) => {
    const token = localStorage.getItem('examforge_token');
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/materials`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || 'Failed to upload material.');
      error.code = data.code || 'UPLOAD_ERROR';
      error.errors = data.errors || [];
      throw error;
    }
    return data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/materials/${id}`, data);
    return res;
  },

  publish: async (id, publishState = true) => {
    const res = await api.patch(`/materials/${id}/publish`, { publish: publishState });
    return res;
  },

  archive: async (id) => {
    const res = await api.patch(`/materials/${id}/archive`);
    return res;
  },

  delete: async (id) => {
    const res = await api.delete(`/materials/${id}`);
    return res;
  },

  download: async (id, originalFileName = 'material-document') => {
    const token = localStorage.getItem('examforge_token');
    const response = await fetch(`${API_BASE_URL}/materials/${id}/download`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to download file.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
