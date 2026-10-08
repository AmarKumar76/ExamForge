const examMonitoringService = require('../services/examMonitoring.service');

class ExamMonitoringController {
  async getInstructorExams(req, res, next) {
    try {
      const statusFilter = req.query.status || 'LIVE';
      const data = await examMonitoringService.getInstructorExams(req.user, statusFilter);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getExamMonitoringDetailStats(req, res, next) {
    try {
      const data = await examMonitoringService.getExamMonitoringDetailStats(req.params.examId, req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMonitoredStudents(req, res, next) {
    try {
      const data = await examMonitoringService.getMonitoredStudents(req.params.examId, req.user, req.query);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentMonitoringDetail(req, res, next) {
    try {
      const data = await examMonitoringService.getStudentMonitoringDetail(
        req.params.examId,
        req.params.studentId,
        req.user
      );
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async addInstructorNote(req, res, next) {
    try {
      const { note } = req.body;
      const attempt = await examMonitoringService.addInstructorNote(req.params.attemptId, note, req.user);
      return res.status(200).json({
        success: true,
        message: 'Instructor note saved successfully.',
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateReviewStatus(req, res, next) {
    try {
      const { reviewStatus } = req.body;
      const attempt = await examMonitoringService.updateReviewStatus(req.params.attemptId, reviewStatus, req.user);
      return res.status(200).json({
        success: true,
        message: 'Review status updated successfully.',
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }

  async endExamEarly(req, res, next) {
    try {
      const result = await examMonitoringService.endExamEarly(req.params.examId, req.user);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.exam,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExamMonitoringController();
