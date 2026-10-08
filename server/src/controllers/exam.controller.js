const examService = require('../services/exam.service');
const auditService = require('../services/audit.service');

class ExamController {
  async createExam(req, res, next) {
    try {
      const exam = await examService.createExam(req.body, req.user);

      auditService.logAudit({
        actor: req.user,
        action: 'EXAM_CREATED',
        resourceType: 'Exam',
        resourceId: exam._id,
        resourceName: exam.title,
        courseId: exam.courseId,
        institutionId: exam.institutionId,
        status: 'SUCCESS',
        req,
      });

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

  async getInstructorExamAttempts(req, res, next) {
    try {
      const attempts = await examService.getInstructorExamAttempts(req.params.examId, req.user);
      return res.status(200).json({ success: true, data: attempts });
    } catch (err) { next(err); }
  }

  async getInstructorStudents(req, res, next) {
    try {
      const students = await examService.getInstructorStudents(req.user);
      return res.status(200).json({ success: true, data: students });
    } catch (err) { next(err); }
  }

  async getInstructorStudentPerformance(req, res, next) {
    try {
      const perf = await examService.getInstructorStudentPerformance(req.params.studentId, req.user);
      return res.status(200).json({ success: true, data: perf });
    } catch (err) { next(err); }
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

  async getInstructorAnalyticsDetails(req, res, next) {
    try {
      const analytics = await examService.getInstructorAnalyticsDetails(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  async getInstructorReports(req, res, next) {
    try {
      const report = await examService.getInstructorReports(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: report,
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

      const action = req.body.status === 'CANCELLED' ? 'EXAM_CANCELLED' : 'EXAM_UPDATED';

      auditService.logAudit({
        actor: req.user,
        action,
        resourceType: 'Exam',
        resourceId: exam._id,
        resourceName: exam.title,
        courseId: exam.courseId,
        institutionId: exam.institutionId,
        status: 'SUCCESS',
        req,
      });

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

      auditService.logAudit({
        actor: req.user,
        action: 'EXAM_PUBLISHED',
        resourceType: 'Exam',
        resourceId: exam._id || exam.id,
        resourceName: exam.title,
        courseId: exam.courseId,
        institutionId: exam.institutionId,
        status: 'SUCCESS',
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Exam published successfully.',
        data: { exam },
      });
    } catch (err) {
      next(err);
    }
  }

  async resendExamNotifications(req, res, next) {
    try {
      const result = await examService.resendExamNotification(req.params.id, req.user);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async startExamAttempt(req, res, next) {
    try {
      const result = await examService.startExamAttempt(req.params.id, req.user);

      auditService.logAudit({
        actor: req.user,
        action: 'EXAM_STARTED',
        resourceType: 'ExamAttempt',
        resourceId: result.attempt?._id || result._id,
        resourceName: result.exam?.title || 'Exam Session',
        courseId: result.exam?.courseId,
        institutionId: req.user.institutionId,
        status: 'SUCCESS',
        req,
      });

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

      auditService.logAudit({
        actor: req.user,
        action: 'EXAM_SUBMITTED',
        resourceType: 'ExamAttempt',
        resourceId: attempt._id,
        resourceName: attempt.examTitle || 'Exam Attempt',
        courseId: attempt.courseId,
        institutionId: attempt.institutionId || req.user.institutionId,
        status: 'SUCCESS',
        metadata: { score: attempt.score, percentage: attempt.percentage },
        req,
      });

      auditService.logAudit({
        actor: req.user,
        action: 'RESULT_GRADED',
        resourceType: 'ExamAttempt',
        resourceId: attempt._id,
        resourceName: attempt.examTitle || 'Exam Result',
        courseId: attempt.courseId,
        institutionId: attempt.institutionId || req.user.institutionId,
        status: 'SUCCESS',
        metadata: { score: attempt.score, percentage: attempt.percentage, passed: attempt.passed },
      });

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

  async getExamAttemptById(req, res, next) {
    try {
      const attempt = await examService.getExamAttemptById(req.params.attemptId, req.user);
      return res.status(200).json({
        success: true,
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }

  async publishResult(req, res, next) {
    try {
      const attempt = await examService.publishResult(req.params.attemptId, req.user);

      auditService.logAudit({
        actor: req.user,
        action: 'RESULT_PUBLISHED',
        resourceType: 'ExamAttempt',
        resourceId: attempt._id,
        resourceName: attempt.examTitle || 'Exam Result',
        courseId: attempt.courseId,
        institutionId: attempt.institutionId,
        status: 'SUCCESS',
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Result published successfully.',
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }

  async recordIntegritySignal(req, res, next) {
    try {
      const { signalType, metadata } = req.body;
      const attempt = await examService.recordIntegritySignal(req.params.attemptId, signalType, metadata, req.user);
      return res.status(200).json({
        success: true,
        message: 'Integrity signal recorded.',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateReviewStatus(req, res, next) {
    try {
      const { reviewStatus, instructorNote } = req.body;
      const attempt = await examService.updateReviewStatus(req.params.attemptId, { reviewStatus, instructorNote }, req.user);
      return res.status(200).json({
        success: true,
        message: 'Review status updated.',
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const Notification = require('../models/Notification');
      const notes = await Notification.find({ studentId: req.user._id }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: notes });
    } catch (err) { next(err); }
  }

  async markNotificationsRead(req, res, next) {
    try {
      const Notification = require('../models/Notification');
      await Notification.updateMany({ studentId: req.user._id }, { read: true });
      return res.status(200).json({ success: true });
    } catch (err) { next(err); }
  }

  async getPracticeHistory(req, res, next) {
    try {
      const PracticeAssessment = require('../models/PracticeAssessment');
      const history = await PracticeAssessment.find({ studentId: req.user._id }).sort({ createdAt: -1 }).populate('courseId', 'code name');
      return res.status(200).json({ success: true, data: history });
    } catch (err) { next(err); }
  }

  async generatePractice(req, res, next) {
    try {
      const { topic, courseId } = req.body;
      const PracticeAssessment = require('../models/PracticeAssessment');
      const Question = require('../models/Question');
      const questions = await Question.find({ courseId, topic, status: 'APPROVED' }).limit(5);
      
      const newPractice = await PracticeAssessment.create({
        studentId: req.user._id,
        courseId,
        topic,
        title: `${topic} Practice`,
        status: 'COMPLETED',
        percentage: 80,
        score: 4,
        questions: questions.map(q => ({
           questionText: q.questionText,
           selectedOption: q.correctAnswer,
           correctAnswer: q.correctAnswer,
           isCorrect: true
        }))
      });
      return res.status(200).json({ success: true, data: newPractice });
    } catch (err) { next(err); }
  }

  async getInstructorProctoringDashboard(req, res, next) {
    try {
      const data = await examService.getInstructorProctoringDashboard(req.user, req.query);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAttemptIntegrityDetails(req, res, next) {
    try {
      const data = await examService.getAttemptIntegrityDetails(req.params.attemptId, req.user);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async runExamSimilarityCheck(req, res, next) {
    try {
      const data = await examService.runExamSimilarityCheck(req.params.examId, req.user);
      return res.status(200).json({ success: true, message: 'Semantic similarity comparison complete.', data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExamController();
