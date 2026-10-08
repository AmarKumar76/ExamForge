const express = require('express');
const router = express.Router();
const examMonitoringController = require('../controllers/examMonitoring.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

// All monitoring endpoints require Instructor or Admin role
const allowedRoles = [ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN];

// List exams for monitoring dashboard
router.get(
  '/exams',
  requireRole(...allowedRoles),
  examMonitoringController.getInstructorExams
);

// Get single exam monitoring summary stats
router.get(
  '/exams/:examId',
  requireRole(...allowedRoles),
  examMonitoringController.getExamMonitoringDetailStats
);

// Get monitored students table for live exam
router.get(
  '/exams/:examId/students',
  requireRole(...allowedRoles),
  examMonitoringController.getMonitoredStudents
);

// Get detailed student attempt monitoring view & timeline
router.get(
  '/exams/:examId/students/:studentId',
  requireRole(...allowedRoles),
  examMonitoringController.getStudentMonitoringDetail
);

// End live exam early for all students
router.post(
  '/exams/:examId/end-early',
  requireRole(...allowedRoles),
  examMonitoringController.endExamEarly
);

// Add instructor note to student attempt
router.post(
  '/attempts/:attemptId/notes',
  requireRole(...allowedRoles),
  examMonitoringController.addInstructorNote
);

// Update integrity review status
router.patch(
  '/attempts/:attemptId/review-status',
  requireRole(...allowedRoles),
  examMonitoringController.updateReviewStatus
);

module.exports = router;
