import { api } from './api';

export const studyPlanService = {
  // Dashboard
  getDashboard: async () => {
    return api.get('/study-plan/dashboard');
  },

  // Tasks
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.view) params.append('view', filters.view);
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.status) params.append('status', filters.status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/study-plan/tasks${queryString}`);
  },

  createTask: async (taskData) => {
    return api.post('/study-plan/tasks', taskData);
  },

  updateTask: async (taskId, updateData) => {
    return api.patch(`/study-plan/tasks/${taskId}`, updateData);
  },

  deleteTask: async (taskId) => {
    return api.delete(`/study-plan/tasks/${taskId}`);
  },

  toggleTask: async (taskId) => {
    return api.patch(`/study-plan/tasks/${taskId}/toggle`);
  },

  // Goals
  getGoals: async () => {
    return api.get('/study-plan/goals');
  },

  createGoal: async (goalData) => {
    return api.post('/study-plan/goals', goalData);
  },

  deleteGoal: async (goalId) => {
    return api.delete(`/study-plan/goals/${goalId}`);
  },

  // AI Roadmap
  generateAIRoadmap: async (params) => {
    return api.post('/study-plan/roadmap/generate', params);
  },

  convertRoadmapToTasks: async (roadmapId) => {
    return api.post(`/study-plan/roadmap/${roadmapId}/convert-tasks`);
  },

  // Revision Plans
  getRevisionPlans: async () => {
    return api.get('/study-plan/revision-plans');
  },

  createRevisionPlan: async (params) => {
    return api.post('/study-plan/revision-plans', params);
  },

  deleteRevisionPlan: async (revisionPlanId) => {
    return api.delete(`/study-plan/revision-plans/${revisionPlanId}`);
  },

  // AI Planning Assistant Chat
  chatWithAssistant: async (message) => {
    return api.post('/study-plan/assistant/chat', { message });
  },
};
