const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlan.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(requireAuth);
router.use(requireRole(ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN));

// Dashboard
router.get('/dashboard', studyPlanController.getDashboard);

// Tasks CRUD
router.get('/tasks', studyPlanController.getTasks);
router.post('/tasks', studyPlanController.createTask);
router.patch('/tasks/:id', studyPlanController.updateTask);
router.delete('/tasks/:id', studyPlanController.deleteTask);
router.patch('/tasks/:id/toggle', studyPlanController.toggleTaskStatus);

// Goals CRUD
router.get('/goals', studyPlanController.getGoals);
router.post('/goals', studyPlanController.createGoal);
router.delete('/goals/:id', studyPlanController.deleteGoal);

// AI Roadmap
router.post('/roadmap/generate', studyPlanController.generateAIRoadmap);
router.post('/roadmap/:id/convert-tasks', studyPlanController.convertRoadmapToTasks);

// Revision Plans
router.get('/revision-plans', studyPlanController.getRevisionPlans);
router.post('/revision-plans', studyPlanController.createRevisionPlan);
router.delete('/revision-plans/:id', studyPlanController.deleteRevisionPlan);

// AI Planning Assistant Chat
router.post('/assistant/chat', studyPlanController.chatWithPlanningAssistant);

module.exports = router;
