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

// Student Exam Routes
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

// Common Detailed Exam Route
router.get(
  '/:id',
  requireRole(ROLES.INSTRUCTOR, ROLES.STUDENT, ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  examController.getExamById
);

module.exports = router;
