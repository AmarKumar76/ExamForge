const express = require('express');
const router = express.Router({ mergeParams: true });
const materialController = require('../controllers/material.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

// Routes nested under /courses/:courseId/materials
router.post(
  '/',
  requireRole(ROLES.INSTRUCTOR),
  upload.single('file'),
  materialController.create
);

router.get(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  materialController.getByCourse
);

module.exports = router;
