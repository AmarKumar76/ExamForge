const questionGeneratorService = require('../services/ai/questionGenerator.service');

class AIController {
  /**
   * Process course material for AI RAG ingestion (text extraction & chunking)
   * POST /api/v1/courses/:courseId/ai/materials/:materialId/process
   */
  async processMaterial(req, res, next) {
    try {
      const { courseId, materialId } = req.params;
      const material = await questionGeneratorService.processMaterialForAI(courseId, materialId, req.user);
      return res.status(200).json({
        success: true,
        message: 'Material processed successfully for AI',
        data: material,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate draft questions via AI & RAG
   * POST /api/v1/courses/:courseId/ai/generate-questions
   */
  async generateQuestions(req, res, next) {
    try {
      const { courseId } = req.params;
      const { materialIds, topic, difficulty, difficultyDistribution, questionTypes, numberOfQuestions } = req.body;

      const questions = await questionGeneratorService.generateDraftQuestions({
        courseId,
        materialIds,
        topic,
        difficulty,
        difficultyDistribution,
        questionTypes,
        numberOfQuestions,
        user: req.user,
      });

      return res.status(201).json({
        success: true,
        message: `${questions.length} draft question(s) generated successfully`,
        data: questions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get draft or approved questions for a course
   * GET /api/v1/courses/:courseId/ai/questions
   */
  async getQuestions(req, res, next) {
    try {
      const { courseId } = req.params;
      const { status } = req.query;

      const questions = await questionGeneratorService.getQuestions(courseId, req.user, status);
      return res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update question text, options, answer, etc.
   * PATCH /api/v1/ai/questions/:id
   */
  async updateQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await questionGeneratorService.updateQuestion(id, req.user, req.body);
      return res.status(200).json({
        success: true,
        message: 'Question updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a draft question
   * PATCH /api/v1/ai/questions/:id/approve
   */
  async approveQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const approved = await questionGeneratorService.approveQuestion(id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Question approved successfully',
        data: approved,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk Approve Draft Questions
   * POST /api/v1/ai/questions/bulk-approve
   */
  async bulkApproveQuestions(req, res, next) {
    try {
      const { questionIds } = req.body;
      const approved = await questionGeneratorService.bulkApproveQuestions(questionIds, req.user);
      return res.status(200).json({
        success: true,
        message: `${approved.length} question(s) approved successfully`,
        data: approved,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a draft question
   * PATCH /api/v1/ai/questions/:id/reject
   */
  async rejectQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const rejected = await questionGeneratorService.rejectQuestion(id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Question rejected successfully',
        data: rejected,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk Reject Draft Questions
   * POST /api/v1/ai/questions/bulk-reject
   */
  async bulkRejectQuestions(req, res, next) {
    try {
      const { questionIds } = req.body;
      const rejected = await questionGeneratorService.bulkRejectQuestions(questionIds, req.user);
      return res.status(200).json({
        success: true,
        message: `${rejected.length} question(s) rejected successfully`,
        data: rejected,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a question
   * DELETE /api/v1/ai/questions/:id
   */
  async deleteQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const result = await questionGeneratorService.deleteQuestion(id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Question deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore a question to DRAFT status
   * PATCH /api/v1/ai/questions/:id/restore
   */
  async restoreQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const restored = await questionGeneratorService.restoreQuestion(id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Question restored successfully',
        data: restored,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AIController();
