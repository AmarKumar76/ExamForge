const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Course = require('../models/Course');
const User = require('../models/User');
const auditService = require('./audit.service');
const integrityService = require('./integrity.service');
const { ROLES } = require('../constants/roles');
const { broadcastMonitoringEvent } = require('../sockets/socket.server');

class ExamMonitoringService {
  /**
   * Helper to verify instructor course access
   */
  async checkInstructorCourseAccess(courseId, user) {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    if (user.role === ROLES.INSTRUCTOR) {
      const isAssigned = course.instructorIds.some(
        (id) => id.toString() === (user._id || user.id).toString()
      );
      if (!isAssigned) {
        const error = new Error('Access denied. You are not assigned to monitor this course exam.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ACCESS';
        throw error;
      }
    } else if (user.role === ROLES.INSTITUTION_ADMIN) {
      if (user.institutionId && course.institutionId.toString() !== user.institutionId.toString()) {
        const error = new Error('Access denied. Exam belongs to another institution.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_INSTITUTION_ACCESS';
        throw error;
      }
    } else if (user.role === ROLES.STUDENT) {
      const error = new Error('Access denied. Students cannot access instructor monitoring.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_ROLE';
      throw error;
    }

    return course;
  }

  /**
   * Derive dynamic exam monitoring state (LIVE, SCHEDULED, ENDED)
   */
  deriveMonitoringStatus(exam) {
    if (exam.status === 'CANCELLED' || exam.status === 'ENDED' || exam.status === 'COMPLETED') {
      return 'COMPLETED';
    }

    const now = new Date();
    const start = exam.startTime ? new Date(exam.startTime) : null;
    const end = exam.endTime ? new Date(exam.endTime) : null;

    if (start && now < start) {
      return 'SCHEDULED';
    }
    if (end && now > end) {
      return 'COMPLETED';
    }
    if (exam.status === 'PUBLISHED' || exam.status === 'ACTIVE' || exam.status === 'SCHEDULED') {
      return 'LIVE';
    }
    return 'SCHEDULED';
  }

  /**
   * Get exams summary & metrics for instructor monitoring dashboard
   */
  async getInstructorExams(user, statusFilter = 'LIVE') {
    let courseQuery = {};
    if (user.role === ROLES.INSTRUCTOR) {
      courseQuery.instructorIds = user._id || user.id;
    } else if (user.role === ROLES.INSTITUTION_ADMIN && user.institutionId) {
      courseQuery.institutionId = user.institutionId;
    }

    const assignedCourses = await Course.find(courseQuery).select('_id name code department studentIds');
    const courseIds = assignedCourses.map((c) => c._id);

    const exams = await Exam.find({ courseId: { $in: courseIds } })
      .populate('courseId', 'name code department studentIds')
      .sort({ createdAt: -1 });

    const examIds = exams.map((e) => e._id);
    const attempts = await ExamAttempt.find({ examId: { $in: examIds } }).populate('studentId', 'name email rollNumber');

    let totalLiveExams = 0;
    let totalStudentsAttempting = 0;
    let totalHighRisk = 0;
    let totalMediumRisk = 0;
    let totalLowRisk = 0;
    let totalIntegritySignals = 0;

    const processedExams = exams.map((exam) => {
      const eObj = exam.toJSON();
      const derivedStatus = this.deriveMonitoringStatus(exam);
      eObj.computedStatus = derivedStatus;

      const eAttempts = attempts.filter((a) => a.examId.toString() === exam._id.toString());
      const attemptingCount = eAttempts.filter((a) => a.status === 'IN_PROGRESS').length;
      const completedCount = eAttempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'GRADED' || a.status === 'PUBLISHED').length;
      const totalEnrolled = exam.courseId?.studentIds ? exam.courseId.studentIds.length : 0;
      const notStartedCount = Math.max(0, totalEnrolled - (attemptingCount + completedCount));

      let highRisk = 0;
      let mediumRisk = 0;
      let lowRisk = 0;
      let examSignalsCount = 0;

      eAttempts.forEach((att) => {
        const aggregation = integrityService.aggregateSignals(att.integritySignals || [], att.questionTimings || []);
        const risk = att.integritySummary?.riskLevel || aggregation.riskLevel || 'LOW';
        if (risk === 'HIGH') highRisk++;
        else if (risk === 'MEDIUM') mediumRisk++;
        else lowRisk++;

        examSignalsCount += att.integritySignals ? att.integritySignals.length : 0;
      });

      if (derivedStatus === 'LIVE') {
        totalLiveExams++;
        totalStudentsAttempting += attemptingCount;
        totalHighRisk += highRisk;
        totalMediumRisk += mediumRisk;
        totalLowRisk += lowRisk;
        totalIntegritySignals += examSignalsCount;
      }

      eObj.monitoringStats = {
        totalStudents: totalEnrolled,
        attempting: attemptingCount,
        completed: completedCount,
        notStarted: notStartedCount,
        highRisk,
        mediumRisk,
        lowRisk,
        totalSignals: examSignalsCount,
      };

      return eObj;
    });

    const filteredExams = processedExams.filter((e) => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'LIVE') return e.computedStatus === 'LIVE';
      if (statusFilter === 'SCHEDULED') return e.computedStatus === 'SCHEDULED';
      if (statusFilter === 'COMPLETED') return e.computedStatus === 'COMPLETED';
      return e.computedStatus === statusFilter;
    });

    return {
      summaryStats: {
        liveExams: totalLiveExams,
        studentsAttempting: totalStudentsAttempting,
        highRisk: totalHighRisk,
        mediumRisk: totalMediumRisk,
        lowRisk: totalLowRisk,
        totalSignals: totalIntegritySignals,
      },
      exams: filteredExams,
    };
  }

  /**
   * Get single exam real-time monitoring details & stats
   */
  async getExamMonitoringDetailStats(examId, user) {
    const exam = await Exam.findById(examId).populate('courseId', 'name code department studentIds instructorIds');
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      throw error;
    }

    await this.checkInstructorCourseAccess(exam.courseId._id || exam.courseId, user);

    const attempts = await ExamAttempt.find({ examId: exam._id });
    const derivedStatus = this.deriveMonitoringStatus(exam);

    const attempting = attempts.filter((a) => a.status === 'IN_PROGRESS').length;
    const completed = attempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'GRADED' || a.status === 'PUBLISHED').length;
    const totalStudents = exam.courseId?.studentIds ? exam.courseId.studentIds.length : 0;
    const notStarted = Math.max(0, totalStudents - (attempting + completed));

    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    let totalSignals = 0;

    attempts.forEach((att) => {
      const aggregation = integrityService.aggregateSignals(att.integritySignals || [], att.questionTimings || []);
      const risk = att.integritySummary?.riskLevel || aggregation.riskLevel || 'LOW';
      if (risk === 'HIGH') highRisk++;
      else if (risk === 'MEDIUM') mediumRisk++;
      else lowRisk++;

      totalSignals += att.integritySignals ? att.integritySignals.length : 0;
    });

    const eObj = exam.toJSON();
    eObj.computedStatus = derivedStatus;

    // Log audit view event
    await auditService.logAudit({
      user,
      action: 'EXAM_MONITORING_VIEWED',
      resourceType: 'EXAM',
      resourceId: exam._id,
      institutionId: exam.institutionId,
      metadata: { examTitle: exam.title },
    });

    return {
      exam: eObj,
      stats: {
        totalStudents,
        attempting,
        completed,
        notStarted,
        highRisk,
        mediumRisk,
        lowRisk,
        totalSignals,
      },
    };
  }

  /**
   * Get live student attempts monitoring table for an exam (paginated, filtered, sorted)
   */
  async getMonitoredStudents(examId, user, filters = {}) {
    const exam = await Exam.findById(examId).populate('courseId', 'name code department studentIds');
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      throw error;
    }

    await this.checkInstructorCourseAccess(exam.courseId._id || exam.courseId, user);

    const course = await Course.findById(exam.courseId._id || exam.courseId).populate('studentIds', 'name email rollNumber');
    const enrolledStudents = course.studentIds || [];
    const attempts = await ExamAttempt.find({ examId: exam._id }).populate('studentId', 'name email rollNumber');

    let studentRecords = enrolledStudents.map((student) => {
      const att = attempts.find((a) => (a.studentId?._id || a.studentId).toString() === student._id.toString());
      const now = new Date();

      if (!att) {
        return {
          student: {
            id: student._id,
            _id: student._id,
            name: student.name,
            email: student.email,
            rollNumber: student.rollNumber || 'N/A',
          },
          attempt: null,
          status: 'NOT_STARTED',
          progressText: `0/${exam.questionsPerStudent || exam.questionIds?.length || 0}`,
          progressPercentage: 0,
          timeElapsedSeconds: 0,
          timeRemainingSeconds: (exam.duration || 60) * 60,
          riskLevel: 'LOW',
          riskScore: 0,
          signalsCount: 0,
          score: 0,
          reviewStatus: 'UNREVIEWED',
          instructorNote: '',
        };
      }

      const qAnsCount = att.answers ? att.answers.filter((a) => a.selectedOption || a.textAnswer).length : 0;
      const qTotalCount = att.questionIds ? att.questionIds.length : exam.questionsPerStudent || exam.questionIds?.length || 0;
      const progressPercentage = qTotalCount > 0 ? Math.round((qAnsCount / qTotalCount) * 100) : 0;

      const startTime = att.startedAt ? new Date(att.startedAt) : new Date();
      const endTime = att.submittedAt ? new Date(att.submittedAt) : now;
      const elapsedSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));
      const remainingSeconds = Math.max(0, (exam.duration || 60) * 60 - elapsedSeconds);

      const aggregation = integrityService.aggregateSignals(att.integritySignals || [], att.questionTimings || []);

      return {
        student: {
          id: student._id,
          _id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber || 'N/A',
        },
        attempt: {
          id: att._id,
          _id: att._id,
          status: att.status,
          startedAt: att.startedAt,
          submittedAt: att.submittedAt,
        },
        status: att.status,
        progressText: `${qAnsCount}/${qTotalCount}`,
        progressPercentage,
        questionsAnswered: qAnsCount,
        questionsTotal: qTotalCount,
        timeElapsedSeconds: elapsedSeconds,
        timeRemainingSeconds: remainingSeconds,
        riskLevel: att.integritySummary?.riskLevel || aggregation.riskLevel || 'LOW',
        riskScore: aggregation.totalScore || 0,
        signalsCount: att.integritySignals ? att.integritySignals.length : 0,
        score: att.totalScore || 0,
        reviewStatus: att.integritySummary?.reviewStatus || 'UNREVIEWED',
        instructorNote: att.integritySummary?.instructorNote || '',
      };
    });

    // Apply Search Filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      studentRecords = studentRecords.filter(
        (r) =>
          r.student.name.toLowerCase().includes(q) ||
          r.student.email.toLowerCase().includes(q) ||
          (r.student.rollNumber && r.student.rollNumber.toLowerCase().includes(q))
      );
    }

    // Apply Risk Level Filter
    if (filters.riskLevel && filters.riskLevel !== 'ALL') {
      studentRecords = studentRecords.filter((r) => r.riskLevel === filters.riskLevel.toUpperCase());
    }

    // Apply Attempt Status Filter
    if (filters.attemptStatus && filters.attemptStatus !== 'ALL') {
      studentRecords = studentRecords.filter((r) => r.status === filters.attemptStatus.toUpperCase());
    }

    // Apply Review Status Filter
    if (filters.reviewStatus && filters.reviewStatus !== 'ALL') {
      studentRecords = studentRecords.filter((r) => r.reviewStatus === filters.reviewStatus.toUpperCase());
    }

    // Apply Sorting
    const sortBy = filters.sortBy || 'riskScore';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    studentRecords.sort((a, b) => {
      if (sortBy === 'riskScore') {
        return (b.riskScore - a.riskScore) * (sortOrder === 1 ? -1 : 1);
      }
      if (sortBy === 'studentName') {
        return a.student.name.localeCompare(b.student.name) * sortOrder;
      }
      if (sortBy === 'progress') {
        return (b.progressPercentage - a.progressPercentage) * (sortOrder === 1 ? -1 : 1);
      }
      if (sortBy === 'signalsCount') {
        return (b.signalsCount - a.signalsCount) * (sortOrder === 1 ? -1 : 1);
      }
      return 0;
    });

    // Pagination
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const paginatedStudents = studentRecords.slice(skip, skip + limit);

    return {
      students: paginatedStudents,
      total: studentRecords.length,
      page,
      limit,
      totalPages: Math.ceil(studentRecords.length / limit) || 1,
    };
  }

  /**
   * Get detailed real-time monitoring view for a specific student attempt
   */
  async getStudentMonitoringDetail(examId, studentId, user) {
    const exam = await Exam.findById(examId).populate('courseId', 'name code department studentIds');
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      throw error;
    }

    await this.checkInstructorCourseAccess(exam.courseId._id || exam.courseId, user);

    const student = await User.findById(studentId).select('name email rollNumber institutionId');
    if (!student) {
      const error = new Error('Student not found.');
      error.statusCode = 404;
      throw error;
    }

    const attempt = await ExamAttempt.findOne({ examId: exam._id, studentId: student._id }).populate(
      'questionIds',
      'questionText type difficulty topic'
    );

    if (!attempt) {
      return {
        student,
        exam: exam.toJSON(),
        attempt: null,
        status: 'NOT_STARTED',
        progress: {
          questionsAnswered: 0,
          questionsRemaining: exam.questionsPerStudent || exam.questionIds?.length || 0,
          currentQuestionNumber: 0,
          totalQuestions: exam.questionsPerStudent || exam.questionIds?.length || 0,
          progressPercentage: 0,
          timeElapsedSeconds: 0,
          timeRemainingSeconds: (exam.duration || 60) * 60,
        },
        riskSummary: {
          riskScore: 0,
          riskLevel: 'LOW',
          totalSignals: 0,
        },
        riskBreakdown: [],
        timeline: [],
        instructorNote: '',
        reviewStatus: 'UNREVIEWED',
      };
    }

    const qAnsCount = attempt.answers ? attempt.answers.filter((a) => a.selectedOption || a.textAnswer).length : 0;
    const qTotalCount = attempt.questionIds ? attempt.questionIds.length : exam.questionsPerStudent || exam.questionIds?.length || 0;
    const progressPercentage = qTotalCount > 0 ? Math.round((qAnsCount / qTotalCount) * 100) : 0;

    const now = new Date();
    const startTime = attempt.startedAt ? new Date(attempt.startedAt) : now;
    const endTime = attempt.submittedAt ? new Date(attempt.submittedAt) : now;
    const elapsedSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));
    const remainingSeconds = Math.max(0, (exam.duration || 60) * 60 - elapsedSeconds);

    const aggregation = integrityService.aggregateSignals(attempt.integritySignals || [], attempt.questionTimings || []);

    // Build Risk Breakdown Array according to weights
    const signalCounts = aggregation.signalCounts || {};
    const riskBreakdown = [
      {
        type: 'Fullscreen Exit',
        code: 'FULLSCREEN_EXIT',
        count: signalCounts['FULLSCREEN_EXIT'] || 0,
        weight: 10,
        scoreContribution: (signalCounts['FULLSCREEN_EXIT'] || 0) * 10,
      },
      {
        type: 'Tab Switch',
        code: 'TAB_SWITCH',
        count: signalCounts['TAB_SWITCH'] || 0,
        weight: 10,
        scoreContribution: (signalCounts['TAB_SWITCH'] || 0) * 10,
      },
      {
        type: 'Copy Attempt',
        code: 'COPY_ATTEMPT',
        count: signalCounts['COPY_ATTEMPT'] || 0,
        weight: 15,
        scoreContribution: (signalCounts['COPY_ATTEMPT'] || 0) * 15,
      },
      {
        type: 'Multiple Face',
        code: 'MULTIPLE_PERSON_DETECTED',
        count: signalCounts['MULTIPLE_PERSON_DETECTED'] || 0,
        weight: 25,
        scoreContribution: (signalCounts['MULTIPLE_PERSON_DETECTED'] || 0) * 25,
      },
      {
        type: 'Face Absent',
        code: 'FACE_NOT_DETECTED',
        count: signalCounts['FACE_NOT_DETECTED'] || 0,
        weight: 10,
        scoreContribution: (signalCounts['FACE_NOT_DETECTED'] || 0) * 10,
      },
      {
        type: 'Repeated Suspicious Pattern',
        code: 'UNUSUAL_TIMING',
        count: signalCounts['UNUSUAL_TIMING'] || 0,
        weight: 5,
        scoreContribution: (signalCounts['UNUSUAL_TIMING'] || 0) * 5,
      },
    ];

    // Build Chronological Timeline
    const timeline = (attempt.integritySignals || []).map((sig) => {
      let description = 'Suspicious activity pattern recorded.';
      switch (sig.signalType) {
        case 'FULLSCREEN_EXIT':
          description = 'Fullscreen mode was exited during the examination session.';
          break;
        case 'TAB_SWITCH':
        case 'WINDOW_BLUR':
          description = 'Browser window lost focus or tab was switched.';
          break;
        case 'COPY_ATTEMPT':
          description = 'Copy keyboard shortcut or context action attempted.';
          break;
        case 'PASTE_ATTEMPT':
          description = 'Paste action attempted in answer box.';
          break;
        case 'MULTIPLE_PERSON_DETECTED':
          description = 'More than one face was detected in camera feed.';
          break;
        case 'FACE_NOT_DETECTED':
          description = 'Primary student face was absent from camera view.';
          break;
        case 'SEMANTIC_SIMILARITY':
          description = sig.metadata?.message || 'High similarity detected with another student submission.';
          break;
        default:
          description = sig.metadata?.message || `${sig.signalType} integrity signal recorded.`;
      }

      return {
        id: sig._id || sig.timestamp,
        signalType: sig.signalType,
        timestamp: sig.timestamp,
        severity: sig.severity || 'MEDIUM',
        description,
        metadata: sig.metadata || {},
      };
    });

    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Log review started audit
    await auditService.logAudit({
      user,
      action: 'INTEGRITY_REVIEW_STARTED',
      resourceType: 'ExamAttempt',
      resourceId: attempt._id,
      institutionId: exam.institutionId,
      metadata: { studentName: student.name, examTitle: exam.title },
    });

    return {
      student,
      exam: exam.toJSON(),
      attempt: attempt.toJSON(),
      status: attempt.status,
      progress: {
        questionsAnswered: qAnsCount,
        questionsRemaining: Math.max(0, qTotalCount - qAnsCount),
        currentQuestionNumber: Math.min(qAnsCount + 1, qTotalCount),
        totalQuestions: qTotalCount,
        progressPercentage,
        timeElapsedSeconds: elapsedSeconds,
        timeRemainingSeconds: remainingSeconds,
      },
      riskSummary: {
        riskScore: aggregation.totalScore || 0,
        riskLevel: attempt.integritySummary?.riskLevel || aggregation.riskLevel || 'LOW',
        totalSignals: attempt.integritySignals ? attempt.integritySignals.length : 0,
      },
      riskBreakdown,
      timeline,
      instructorNote: attempt.integritySummary?.instructorNote || '',
      reviewStatus: attempt.integritySummary?.reviewStatus || 'UNREVIEWED',
    };
  }

  /**
   * Save instructor note on student attempt
   */
  async addInstructorNote(attemptId, noteText, user) {
    const attempt = await ExamAttempt.findById(attemptId).populate('examId');
    if (!attempt) {
      const error = new Error('Exam attempt not found.');
      error.statusCode = 404;
      throw error;
    }

    const exam = attempt.examId;
    await this.checkInstructorCourseAccess(exam.courseId, user);

    if (!attempt.integritySummary) {
      attempt.integritySummary = {};
    }

    attempt.integritySummary.instructorNote = (noteText || '').trim();
    attempt.integritySummary.reviewedAt = new Date();
    attempt.integritySummary.reviewedBy = user._id || user.id;

    await attempt.save();

    await auditService.logAudit({
      user,
      action: 'INSTRUCTOR_NOTE_ADDED',
      resourceType: 'ExamAttempt',
      resourceId: attempt._id,
      institutionId: attempt.institutionId,
      metadata: { note: noteText.substring(0, 50) },
    });

    // Broadcast real-time socket update to instructor monitoring room
    broadcastMonitoringEvent(exam._id.toString(), 'attempt_updated', {
      attemptId: attempt._id,
      studentId: attempt.studentId,
      instructorNote: noteText,
    });

    return attempt;
  }

  /**
   * Update student attempt integrity review status
   */
  async updateReviewStatus(attemptId, reviewStatus, user) {
    const validStatuses = ['UNREVIEWED', 'REVIEWING', 'REVIEWED', 'ESCALATED', 'FLAGGED', 'PENDING'];
    if (!validStatuses.includes(reviewStatus)) {
      const error = new Error(`Invalid review status: ${reviewStatus}`);
      error.statusCode = 400;
      throw error;
    }

    const attempt = await ExamAttempt.findById(attemptId).populate('examId');
    if (!attempt) {
      const error = new Error('Exam attempt not found.');
      error.statusCode = 404;
      throw error;
    }

    const exam = attempt.examId;
    await this.checkInstructorCourseAccess(exam.courseId, user);

    if (!attempt.integritySummary) {
      attempt.integritySummary = {};
    }

    attempt.integritySummary.reviewStatus = reviewStatus;
    attempt.integritySummary.reviewedAt = new Date();
    attempt.integritySummary.reviewedBy = user._id || user.id;

    await attempt.save();

    const action = reviewStatus === 'ESCALATED' ? 'INTEGRITY_ESCALATED' : 'INTEGRITY_MARKED_REVIEWED';

    await auditService.logAudit({
      user,
      action,
      resourceType: 'ExamAttempt',
      resourceId: attempt._id,
      institutionId: attempt.institutionId,
      metadata: { reviewStatus },
    });

    // Broadcast real-time socket update
    broadcastMonitoringEvent(exam._id.toString(), 'attempt_updated', {
      attemptId: attempt._id,
      studentId: attempt.studentId,
      reviewStatus,
    });

    return attempt;
  }

  /**
   * End live exam early for all students
   */
  async endExamEarly(examId, user) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      throw error;
    }

    await this.checkInstructorCourseAccess(exam.courseId, user);

    exam.status = 'ENDED';
    exam.endTime = new Date();
    await exam.save();

    // Auto-submit all currently in-progress student attempts
    await ExamAttempt.updateMany(
      { examId: exam._id, status: 'IN_PROGRESS' },
      { $set: { status: 'SUBMITTED', submittedAt: new Date() } }
    );

    await auditService.logAudit({
      user,
      action: 'EXAM_ENDED_EARLY',
      resourceType: 'EXAM',
      resourceId: exam._id,
      institutionId: exam.institutionId,
      metadata: { examTitle: exam.title },
    });

    // Broadcast live socket event to end exam for all students & instructors
    broadcastMonitoringEvent(exam._id.toString(), 'exam_ended_early', {
      examId: exam._id,
      status: 'ENDED',
      endedAt: new Date(),
    });

    return {
      success: true,
      message: `Exam "${exam.title}" has been ended early.`,
      exam,
    };
  }
}

module.exports = new ExamMonitoringService();
