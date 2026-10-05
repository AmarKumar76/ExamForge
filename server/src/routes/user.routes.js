const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

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

router.patch(
  '/:id/status',
  requireRole(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.updateUserStatus
);

module.exports = router;
