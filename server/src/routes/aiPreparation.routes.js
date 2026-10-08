const express = require('express');
const router = express.Router();
const aiPreparationController = require('../controllers/aiPreparation.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);
router.use(requireRole(ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN));

router.get('/', aiPreparationController.getAIPreparation);
router.get('/materials/search', aiPreparationController.searchCourseMaterials);
router.post('/tutor/chat', aiPreparationController.chatWithTutor);

module.exports = router;
