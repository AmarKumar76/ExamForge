const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institution.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

// All institution routes require authentication
router.use(requireAuth);

router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN),
  institutionController.create
);

router.get(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  institutionController.getAll
);

router.get(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  institutionController.getById
);

router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  institutionController.update
);

router.post(
  '/:id/departments',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  institutionController.addDepartment
);

router.patch(
  '/:id/archive',
  requireRole(ROLES.SUPER_ADMIN),
  institutionController.archive
);

module.exports = router;
