const reportService = require('../services/report.service');

class ReportController {
  async getReport(req, res, next) {
    try {
      const data = await reportService.generateReport(req.user, req.query);
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportReport(req, res, next) {
    try {
      await reportService.exportReport(req.user, req.query, res);
    } catch (err) {
      next(err);
    }
  }

  async getExamReport(req, res, next) {
    try {
      const query = { ...req.query, reportType: 'EXAM_RESULT', examId: req.params.examId };
      const data = await reportService.generateReport(req.user, query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getStudentReport(req, res, next) {
    try {
      const query = { ...req.query, reportType: 'STUDENT_PERFORMANCE', studentId: req.params.studentId };
      const data = await reportService.generateReport(req.user, query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getQuestionAnalysisReport(req, res, next) {
    try {
      const query = { ...req.query, reportType: 'QUESTION_ANALYSIS', examId: req.params.examId };
      const data = await reportService.generateReport(req.user, query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getCourseReport(req, res, next) {
    try {
      const query = { ...req.query, reportType: 'COURSE_PERFORMANCE', courseId: req.params.courseId };
      const data = await reportService.generateReport(req.user, query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getIntegrityReport(req, res, next) {
    try {
      const query = { ...req.query, reportType: 'ACADEMIC_INTEGRITY', examId: req.params.examId };
      const data = await reportService.generateReport(req.user, query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
