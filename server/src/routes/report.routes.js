const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);
router.use(requireRole(ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN));

router.get('/', reportController.getReport);
router.get('/export', reportController.exportReport);

// Specific report endpoints
router.get('/exam/:examId', reportController.getExamReport);
router.get('/student/:studentId', reportController.getStudentReport);
router.get('/question-analysis/:examId', reportController.getQuestionAnalysisReport);
router.get('/course/:courseId', reportController.getCourseReport);
router.get('/integrity/:examId', reportController.getIntegrityReport);

module.exports = router;
