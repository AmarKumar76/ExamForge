import { api } from './api';

export const examMonitoringService = {
  /**
   * Get exams summary & metrics for instructor monitoring dashboard
   */
  getInstructorExams: async (status = 'LIVE') => {
    return api.get(`/exam-monitoring/exams?status=${status}`);
  },

  /**
   * Get single exam monitoring summary stats
   */
  getExamDetailStats: async (examId) => {
    return api.get(`/exam-monitoring/exams/${examId}`);
  },

  /**
   * Get live monitored students table for an exam with filtering, sorting & pagination
   */
  getMonitoredStudents: async (examId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters.attemptStatus) params.append('attemptStatus', filters.attemptStatus);
    if (filters.reviewStatus) params.append('reviewStatus', filters.reviewStatus);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/exam-monitoring/exams/${examId}/students${queryString}`);
  },

  /**
   * Get detailed student attempt monitoring view & timeline
   */
  getStudentDetail: async (examId, studentId) => {
    return api.get(`/exam-monitoring/exams/${examId}/students/${studentId}`);
  },

  /**
   * Add instructor note to student attempt
   */
  addInstructorNote: async (attemptId, note) => {
    return api.post(`/exam-monitoring/attempts/${attemptId}/notes`, { note });
  },

  /**
   * Update student attempt integrity review status
   */
  updateReviewStatus: async (attemptId, reviewStatus) => {
    return api.patch(`/exam-monitoring/attempts/${attemptId}/review-status`, { reviewStatus });
  },

  /**
   * End live exam early for all in-progress students
   */
  endExamEarly: async (examId) => {
    return api.post(`/exam-monitoring/exams/${examId}/end-early`);
  },
};
