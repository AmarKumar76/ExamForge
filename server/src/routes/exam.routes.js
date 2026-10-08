const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

// Instructor Exam Routes
router.post(
  '/',
  requireRole(ROLES.INSTRUCTOR),
  examController.createExam
);

router.get(
  '/instructor',
  requireRole(ROLES.INSTRUCTOR),
  examController.getInstructorExams
);

router.get(
  '/instructor/analytics',
  requireRole(ROLES.INSTRUCTOR),
  examController.getInstructorAnalytics
);

router.get(
  '/instructor/analytics/details',
  requireRole(ROLES.INSTRUCTOR),
  examController.getInstructorAnalyticsDetails
);

router.get(
  '/instructor/reports',
  requireRole(ROLES.INSTRUCTOR),
  examController.getInstructorReports
);

router.get(
  '/instructor/:examId/attempts',
  requireRole(ROLES.INSTRUCTOR),
  examController.getInstructorExamAttempts
);

router.get(
  '/instructor/students',
  requireRole(ROLES.INSTRUCTOR),
  examController.getInstructorStudents
);

router.get(
  '/instructor/students/:studentId/performance',
  requireRole(ROLES.INSTRUCTOR),
  examController.getInstructorStudentPerformance
);

router.patch(
  '/:id',
  requireRole(ROLES.INSTRUCTOR),
  examController.updateExam
);

router.patch(
  '/:id/publish',
  requireRole(ROLES.INSTRUCTOR),
  examController.publishExam
);

router.post(
  '/:id/resend-notifications',
  requireRole(ROLES.INSTRUCTOR),
  examController.resendExamNotifications
);

router.patch(
  '/attempts/:attemptId/publish',
  requireRole(ROLES.INSTRUCTOR),
  examController.publishResult
);

router.patch(
  '/attempts/:attemptId/review-status',
  requireRole(ROLES.INSTRUCTOR),
  examController.updateReviewStatus
);

router.get(
  '/instructor/proctoring/dashboard',
  requireRole(ROLES.INSTRUCTOR),
  examController.getInstructorProctoringDashboard
);

router.get(
  '/instructor/attempts/:attemptId/integrity',
  requireRole(ROLES.INSTRUCTOR),
  examController.getAttemptIntegrityDetails
);

router.post(
  '/instructor/exams/:examId/similarity-check',
  requireRole(ROLES.INSTRUCTOR),
  examController.runExamSimilarityCheck
);

// Student Exam Routes
router.get(
  '/student/notifications',
  requireRole(ROLES.STUDENT),
  examController.getNotifications
);
router.patch(
  '/student/notifications/read',
  requireRole(ROLES.STUDENT),
  examController.markNotificationsRead
);
router.get(
  '/student/practice',
  requireRole(ROLES.STUDENT),
  examController.getPracticeHistory
);
router.post(
  '/student/practice/generate',
  requireRole(ROLES.STUDENT),
  examController.generatePractice
);

router.get(
  '/student',
  requireRole(ROLES.STUDENT),
  examController.getStudentExams
);

router.post(
  '/:id/start',
  requireRole(ROLES.STUDENT),
  examController.startExamAttempt
);

router.post(
  '/attempts/:attemptId/submit',
  requireRole(ROLES.STUDENT),
  examController.submitExamAttempt
);

router.patch(
  '/attempts/:attemptId/save',
  requireRole(ROLES.STUDENT),
  examController.saveExamAttemptProgress
);

router.post(
  '/attempts/:attemptId/signal',
  requireRole(ROLES.STUDENT),
  examController.recordIntegritySignal
);

// Common Detailed Exam Route
router.get(
  '/:id',
  requireRole(ROLES.INSTRUCTOR, ROLES.STUDENT, ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  examController.getExamById
);

router.get(
  '/attempts/:attemptId',
  requireRole(ROLES.INSTRUCTOR, ROLES.STUDENT, ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  examController.getExamAttemptById
);

module.exports = router;
