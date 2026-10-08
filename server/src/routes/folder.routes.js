const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folder.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

const INSTRUCTOR_ROLE = [ROLES.INSTRUCTOR];

// Direct folder operations
router.patch('/:id', requireRole(...INSTRUCTOR_ROLE), folderController.updateFolder);
router.delete('/:id', requireRole(...INSTRUCTOR_ROLE), folderController.deleteFolder);

// Move questions
router.post('/move-question', requireRole(...INSTRUCTOR_ROLE), folderController.moveQuestion);
router.post('/bulk-move', requireRole(...INSTRUCTOR_ROLE), folderController.bulkMoveQuestions);

module.exports = router;
