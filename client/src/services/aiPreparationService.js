import { api } from './api';

export const aiPreparationService = {
  getAIPreparation: async () => {
    return api.get('/ai-preparation');
  },

  searchMaterials: async (courseId, query) => {
    return api.get(`/ai-preparation/materials/search?courseId=${courseId}&query=${encodeURIComponent(query)}`);
  },

  chatWithTutor: async ({ message, courseId, topic, contextText }) => {
    return api.post('/ai-preparation/tutor/chat', { message, courseId, topic, contextText });
  },
};
