const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

// All course routes require authentication
router.use(requireAuth);

router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  courseController.create
);

router.get(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  courseController.getAll
);

router.get(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  courseController.getById
);

router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR),
  courseController.update
);

router.post(
  '/:id/instructors',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  courseController.manageInstructors
);

router.post(
  '/:id/students',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR),
  courseController.manageStudents
);

router.post(
  '/:id/enroll',
  requireRole(ROLES.STUDENT),
  courseController.selfEnroll
);

router.patch(
  '/:id/archive',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  courseController.archive
);

module.exports = router;
