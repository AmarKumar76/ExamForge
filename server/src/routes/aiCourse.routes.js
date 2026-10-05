const express = require('express');
const router = express.Router({ mergeParams: true });
const aiController = require('../controllers/ai.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

const INSTRUCTOR_ROLE = [ROLES.INSTRUCTOR];

// Process material for AI RAG ingestion
router.post(
  '/materials/:materialId/process',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.processMaterial
);

// Generate draft questions
router.post(
  '/generate-questions',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.generateQuestions
);

// List course questions
router.get(
  '/questions',
  requireRole(...INSTRUCTOR_ROLE),
  aiController.getQuestions
);

module.exports = router;
