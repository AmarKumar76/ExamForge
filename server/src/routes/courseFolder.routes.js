const express = require('express');
const router = express.Router({ mergeParams: true });
const folderController = require('../controllers/folder.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);

const INSTRUCTOR_ROLE = [ROLES.INSTRUCTOR];

// List folders for a course (with question counts)
router.get('/', requireRole(...INSTRUCTOR_ROLE), folderController.getFolders);

// Create folder for a course
router.post('/', requireRole(...INSTRUCTOR_ROLE), folderController.createFolder);

module.exports = router;
