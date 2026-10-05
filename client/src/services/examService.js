import { api } from './api';

export const examService = {
  /**
   * Create exam for an assigned course
   */
  create: async (examData) => {
    return api.post('/exams', examData);
  },

  /**
   * Get exams for assigned courses (Instructor)
   */
  getInstructorExams: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.courseId) params.append('courseId', filters.courseId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/exams/instructor${queryString}`);
  },

  /**
   * Get real instructor workspace analytics
   */
  getInstructorAnalytics: async () => {
    return api.get('/exams/instructor/analytics');
  },

  /**
   * Get exams for enrolled courses (Student)
   */
  getStudentExams: async () => {
    return api.get('/exams/student');
  },

  /**
   * Get single exam details
   */
  getById: async (id) => {
    return api.get(`/exams/${id}`);
  },

  /**
   * Update draft exam details
   */
  update: async (id, updateData) => {
    return api.patch(`/exams/${id}`, updateData);
  },

  /**
   * Publish exam for student access
   */
  publish: async (id) => {
    return api.patch(`/exams/${id}/publish`);
  },

  /**
   * Start or resume exam attempt (Student)
   */
  startAttempt: async (examId) => {
    return api.post(`/exams/${examId}/start`);
  },

  /**
   * Submit exam attempt for auto-grading & AI analysis (Student)
   */
  submitAttempt: async (attemptId, answers) => {
    return api.post(`/exams/attempts/${attemptId}/submit`, { answers });
  },

  /**
   * Save exam attempt progress without submitting (Student)
   */
  saveProgress: async (attemptId, answers) => {
    return api.patch(`/exams/attempts/${attemptId}/save`, { answers });
  },
};
