const studyPlanService = require('../services/studyPlan.service');

class StudyPlanController {
  async getDashboard(req, res, next) {
    try {
      const data = await studyPlanService.getDashboardOverview(req.user);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Tasks
  async createTask(req, res, next) {
    try {
      const task = await studyPlanService.createTask(req.user, req.body);
      return res.status(201).json({ success: true, message: 'Task created.', data: { task } });
    } catch (err) {
      next(err);
    }
  }

  async getTasks(req, res, next) {
    try {
      const tasks = await studyPlanService.getTasks(req.user, req.query);
      return res.status(200).json({ success: true, data: { tasks } });
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req, res, next) {
    try {
      const task = await studyPlanService.updateTask(req.user, req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Task updated.', data: { task } });
    } catch (err) {
      next(err);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const result = await studyPlanService.deleteTask(req.user, req.params.id);
      return res.status(200).json({ success: true, message: 'Task deleted.', data: result });
    } catch (err) {
      next(err);
    }
  }

  async toggleTaskStatus(req, res, next) {
    try {
      const task = await studyPlanService.toggleTaskStatus(req.user, req.params.id);
      return res.status(200).json({ success: true, message: 'Task status updated.', data: { task } });
    } catch (err) {
      next(err);
    }
  }

  // Goals
  async createGoal(req, res, next) {
    try {
      const goal = await studyPlanService.createGoal(req.user, req.body);
      return res.status(201).json({ success: true, message: 'Study goal created.', data: { goal } });
    } catch (err) {
      next(err);
    }
  }

  async getGoals(req, res, next) {
    try {
      const goals = await studyPlanService.getGoals(req.user);
      return res.status(200).json({ success: true, data: { goals } });
    } catch (err) {
      next(err);
    }
  }

  async deleteGoal(req, res, next) {
    try {
      const result = await studyPlanService.deleteGoal(req.user, req.params.id);
      return res.status(200).json({ success: true, message: 'Goal deleted.', data: result });
    } catch (err) {
      next(err);
    }
  }

  // AI Roadmap
  async generateAIRoadmap(req, res, next) {
    try {
      const roadmap = await studyPlanService.generateAIRoadmap(req.user, req.body);
      return res.status(201).json({ success: true, message: 'AI Study Roadmap generated.', data: { roadmap } });
    } catch (err) {
      next(err);
    }
  }

  async convertRoadmapToTasks(req, res, next) {
    try {
      const result = await studyPlanService.convertRoadmapToTasks(req.user, req.params.id);
      return res.status(200).json({ success: true, message: 'Roadmap converted to study tasks.', data: result });
    } catch (err) {
      next(err);
    }
  }

  // Revision Plans
  async createRevisionPlan(req, res, next) {
    try {
      const plan = await studyPlanService.createRevisionPlan(req.user, req.body);
      return res.status(201).json({ success: true, message: 'Exam revision plan created.', data: { plan } });
    } catch (err) {
      next(err);
    }
  }

  async getRevisionPlans(req, res, next) {
    try {
      const plans = await studyPlanService.getRevisionPlans(req.user);
      return res.status(200).json({ success: true, data: { plans } });
    } catch (err) {
      next(err);
    }
  }

  async deleteRevisionPlan(req, res, next) {
    try {
      const result = await studyPlanService.deleteRevisionPlan(req.user, req.params.id);
      return res.status(200).json({ success: true, message: 'Revision plan deleted.', data: result });
    } catch (err) {
      next(err);
    }
  }

  // AI Assistant
  async chatWithPlanningAssistant(req, res, next) {
    try {
      const result = await studyPlanService.chatWithPlanningAssistant(req.user, req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StudyPlanController();
