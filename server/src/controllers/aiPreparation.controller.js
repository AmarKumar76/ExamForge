const aiPreparationService = require('../services/aiPreparation.service');

class AIPreparationController {
  async getAIPreparation(req, res, next) {
    try {
      const data = await aiPreparationService.getStudentAIPreparation(req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async searchCourseMaterials(req, res, next) {
    try {
      const { courseId, query } = req.query;
      const data = await aiPreparationService.searchCourseMaterials(req.user, courseId, query);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async chatWithTutor(req, res, next) {
    try {
      const { message, courseId, topic, contextText } = req.body;
      const data = await aiPreparationService.chatWithTutor(req.user, { message, courseId, topic, contextText });
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AIPreparationController();
