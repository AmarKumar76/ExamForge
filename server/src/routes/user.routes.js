const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

router.put('/profile', userController.updateProfile);
router.put('/password', userController.changePassword);
router.put('/preferences', userController.updatePreferences);

router.get(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.getUsers
);

router.get(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.getUserById
);

router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.createUser
);

router.post(
  '/bulk-import',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.bulkImportUsers
);

router.patch(
  '/:id/status',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.updateUserStatus
);

router.post(
  '/:id/resend-welcome-email',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.resendWelcomeEmail
);

module.exports = router;
