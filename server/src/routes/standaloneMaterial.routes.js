const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

router.get(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  materialController.getById
);

router.get(
  '/:id/download',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  materialController.download
);

router.patch(
  '/:id',
  requireRole(ROLES.INSTRUCTOR),
  materialController.update
);

router.patch(
  '/:id/publish',
  requireRole(ROLES.INSTRUCTOR),
  materialController.publish
);

router.patch(
  '/:id/archive',
  requireRole(ROLES.INSTRUCTOR),
  materialController.archive
);

router.delete(
  '/:id',
  requireRole(ROLES.INSTRUCTOR),
  materialController.remove
);

module.exports = router;
