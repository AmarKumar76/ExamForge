const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

const INSTRUCTOR_ROLE = [ROLES.INSTRUCTOR];

// Update question fields
router.patch(
  '/:id',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.updateQuestion
);

// Approve draft question
router.patch(
  '/:id/approve',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.approveQuestion
);

// Bulk Approve draft questions
router.post(
  '/bulk-approve',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.bulkApproveQuestions
);

// Bulk Reject draft questions
router.post(
  '/bulk-reject',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.bulkRejectQuestions
);

// Reject draft question
router.patch(
  '/:id/reject',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.rejectQuestion
);

// Restore question to draft status
router.patch(
  '/:id/restore',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.restoreQuestion
);

// Delete question
router.delete(
  '/:id',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.deleteQuestion
);

module.exports = router;
