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

  /**
   * Get attempt details (Student/Instructor)
   */
  getAttemptDetails: async (attemptId) => {
    return api.get(`/exams/attempts/${attemptId}`);
  },

  /**
   * Publish Result (Instructor)
   */
  publishResult: async (attemptId) => {
    return api.patch(`/exams/attempts/${attemptId}/publish`);
  },

  /**
   * Update Integrity Review Status (Instructor)
   */
  updateReviewStatus: async (attemptId, reviewStatus, instructorNote) => {
    return api.patch(`/exams/attempts/${attemptId}/review-status`, { reviewStatus, instructorNote });
  },

  /**
   * Send integrity signal (Student)
   */
  sendIntegritySignal: async (attemptId, signalType, metadata = {}) => {
    return api.post(`/exams/attempts/${attemptId}/signal`, { signalType, metadata });
  },

  getPracticeHistory: async () => {
    return api.get('/exams/student/practice');
  },

  generatePractice: async (topic, courseId) => {
    return api.post('/exams/student/practice/generate', { topic, courseId });
  },

  getNotifications: async () => {
    return api.get('/exams/student/notifications');
  },

  markNotificationsRead: async () => {
    return api.patch('/exams/student/notifications/read');
  },

  getInstructorExamAttempts: async (examId) => {
    return api.get(`/exams/instructor/${examId}/attempts`);
  },

  getInstructorStudents: async () => {
    return api.get('/exams/instructor/students');
  },

  getInstructorStudentPerformance: async (studentId) => {
    return api.get(`/exams/instructor/students/${studentId}/performance`);
  },

  getInstructorAnalyticsDetails: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.examId) params.append('examId', filters.examId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/exams/instructor/analytics/details${queryString}`);
  },

  getInstructorReports: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.examId) params.append('examId', filters.examId);
    if (filters.reportType) params.append('reportType', filters.reportType);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/exams/instructor/reports${queryString}`);
  },

  getInstructorProctoringDashboard: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.examId) params.append('examId', filters.examId);
    if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters.reviewStatus) params.append('reviewStatus', filters.reviewStatus);
    if (filters.signalType) params.append('signalType', filters.signalType);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/exams/instructor/proctoring/dashboard${queryString}`);
  },

  getAttemptIntegrityDetails: async (attemptId) => {
    return api.get(`/exams/instructor/attempts/${attemptId}/integrity`);
  },

  runExamSimilarityCheck: async (examId) => {
    return api.post(`/exams/instructor/exams/${examId}/similarity-check`);
  }
};
