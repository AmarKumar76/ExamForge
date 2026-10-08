const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

router.get(
  '/audit-logs',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  auditController.getAuditLogs
);

router.get(
  '/system-logs',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  auditController.getSystemLogs
);

router.get(
  '/counts',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  auditController.getLogCounts
);

router.get(
  '/analytics',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  auditController.getAnalytics
);

module.exports = router;
