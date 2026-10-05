const examService = require('../services/exam.service');

class ExamController {
  async createExam(req, res, next) {
    try {
      const exam = await examService.createExam(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Exam created successfully.',
        data: { exam },
      });
    } catch (err) {
      next(err);
    }
  }

  async getInstructorExams(req, res, next) {
    try {
      const exams = await examService.getExamsForInstructor(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: { exams },
      });
    } catch (err) {
      next(err);
    }
  }

  async getInstructorAnalytics(req, res, next) {
    try {
      const analytics = await examService.getInstructorAnalytics(req.user);
      return res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentExams(req, res, next) {
    try {
      const result = await examService.getStudentExams(req.user);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getExamById(req, res, next) {
    try {
      const exam = await examService.getExamById(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        data: { exam },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateExam(req, res, next) {
    try {
      const exam = await examService.updateExam(req.params.id, req.body, req.user);
      return res.status(200).json({
        success: true,
        message: 'Exam updated successfully.',
        data: { exam },
      });
    } catch (err) {
      next(err);
    }
  }

  async publishExam(req, res, next) {
    try {
      const exam = await examService.publishExam(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Exam published successfully.',
        data: { exam },
      });
    } catch (err) {
      next(err);
    }
  }

  async startExamAttempt(req, res, next) {
    try {
      const result = await examService.startExamAttempt(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Exam session initialized.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitExamAttempt(req, res, next) {
    try {
      const { answers } = req.body;
      const attempt = await examService.submitExamAttempt(req.params.attemptId, answers, req.user);
      return res.status(200).json({
        success: true,
        message: 'Exam attempt submitted and graded successfully.',
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }

  async saveExamAttemptProgress(req, res, next) {
    try {
      const { answers } = req.body;
      const attempt = await examService.saveExamAttemptProgress(req.params.attemptId, answers, req.user);
      return res.status(200).json({
        success: true,
        message: 'Exam attempt progress saved successfully.',
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExamController();
