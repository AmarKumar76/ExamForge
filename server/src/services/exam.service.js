const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Course = require('../models/Course');
const Question = require('../models/Question');
const CourseMaterial = require('../models/CourseMaterial');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');
const auditService = require('./audit.service');
const integrityService = require('./integrity.service');
const reportService = require('./report.service');
const emailService = require('./email.service');
const { parseISTDateTime, formatExamDateTime, formatExamDate, formatExamTime } = require('../utils/dateUtils');

class ExamService {
  /**
   * Helper to check instructor assignment for course
   */
  async checkInstructorCourseAccess(courseId, user) {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    if (user.role !== ROLES.INSTRUCTOR) {
      const error = new Error('Only instructors can perform this exam action.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_ROLE';
      throw error;
    }

    const isAssigned = course.instructorIds.some((id) => id.toString() === user._id.toString());
    if (!isAssigned) {
      const error = new Error('Access denied. You are not assigned to this course.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_COURSE_ACCESS';
      throw error;
    }

    return course;
  }

  /**
   * Helper to derive dynamic exam lifecycle status based on current time
   */
  deriveExamStatus(exam) {
    if (exam.status === 'DRAFT' || exam.status === 'ARCHIVED') {
      return exam.status;
    }
    const now = new Date();
    const start = exam.startTime ? new Date(exam.startTime) : null;
    const end = exam.endTime ? new Date(exam.endTime) : null;

    if (start && now < start) {
      return 'SCHEDULED';
    }
    if (end && now > end) {
      return 'ENDED';
    }
    return 'ACTIVE';
  }

  /**
   * Create an official exam for an assigned course
   */
  async createExam(
    {
      courseId,
      title,
      description,
      duration,
      totalMarks,
      passingMarks,
      folderIds = [],
      questionSourceFolders = [],
      questionIds = [],
      questionsPerStudent = 0,
      difficultyDistribution = null,
      startTime,
      endTime,
    },
    user
  ) {
    const course = await this.checkInstructorCourseAccess(courseId, user);

    if (!title || !title.trim()) {
      const error = new Error('Exam title is required.');
      error.statusCode = 400;
      error.code = 'INVALID_EXAM_TITLE';
      throw error;
    }

    const dur = parseInt(duration, 10) || 60;
    if (dur <= 0) {
      const error = new Error('Exam duration must be greater than 0 minutes.');
      error.statusCode = 400;
      error.code = 'INVALID_DURATION';
      throw error;
    }

    const totMarks = parseInt(totalMarks, 10) || 100;
    const passMarks = parseInt(passingMarks, 10) || 40;
    if (passMarks > totMarks) {
      const error = new Error(`Passing marks (${passMarks}) cannot be greater than total marks (${totMarks}).`);
      error.statusCode = 400;
      error.code = 'INVALID_PASSING_MARKS';
      throw error;
    }

    const start = startTime ? parseISTDateTime(startTime) : null;
    const end = endTime ? parseISTDateTime(endTime) : null;
    if (start && end && start >= end) {
      const error = new Error('Exam start time must be before end time.');
      error.statusCode = 400;
      error.code = 'INVALID_EXAM_SCHEDULE';
      throw error;
    }

    const effectiveFolderIds = Array.isArray(folderIds) && folderIds.length > 0
      ? folderIds
      : (Array.isArray(questionSourceFolders) ? questionSourceFolders : []);

    // Verify all selected questions are APPROVED and belong to this course & selected chapter folders
    let poolQuestions = [];
    if (!questionIds || questionIds.length === 0) {
      const query = {
        courseId: course._id,
        institutionId: course.institutionId,
        status: 'APPROVED',
      };

      if (effectiveFolderIds.length > 0) {
        const hasUncategorized = effectiveFolderIds.includes('uncategorized') || effectiveFolderIds.includes(null);
        const realFolderIds = effectiveFolderIds.filter((id) => id && id !== 'uncategorized');

        if (hasUncategorized && realFolderIds.length > 0) {
          query.$or = [{ folderId: { $in: realFolderIds } }, { folderId: null }];
        } else if (hasUncategorized) {
          query.folderId = null;
        } else if (realFolderIds.length > 0) {
          query.folderId = { $in: realFolderIds };
        }
      }

      poolQuestions = await Question.find(query);
      questionIds = poolQuestions.map((q) => q._id);
    } else {
      poolQuestions = await Question.find({
        _id: { $in: questionIds },
        courseId: course._id,
      });
    }

    if (poolQuestions.length === 0) {
      const error = new Error('No approved questions available for the selected chapter(s) in the Question Bank.');
      error.statusCode = 400;
      error.code = 'NO_APPROVED_QUESTIONS';
      throw error;
    }

    if (poolQuestions.length !== questionIds.length) {
      const error = new Error('One or more selected questions do not belong to this course.');
      error.statusCode = 400;
      error.code = 'INVALID_QUESTION_SELECTION';
      throw error;
    }

    const unapproved = poolQuestions.find((q) => q.status !== 'APPROVED');
    if (unapproved) {
      const error = new Error(
        `Question "${unapproved.questionText.substring(0, 30)}..." is not approved. Only APPROVED questions can be added to an official exam.`
      );
      error.statusCode = 400;
      error.code = 'UNAPPROVED_QUESTION_SELECTION';
      throw error;
    }

    // Strictly validate question folder membership if specific folders were chosen
    const realFolders = effectiveFolderIds.filter((id) => id && id !== 'uncategorized').map((id) => id.toString());
    const hasUncat = effectiveFolderIds.includes('uncategorized') || effectiveFolderIds.includes(null);

    if (effectiveFolderIds.length > 0) {
      const invalidFolderQuestion = poolQuestions.find((q) => {
        const qFolderStr = q.folderId ? q.folderId.toString() : null;
        if (!qFolderStr) return !hasUncat;
        return !realFolders.includes(qFolderStr);
      });

      if (invalidFolderQuestion) {
        const error = new Error('One or more selected questions do not belong to the selected chapter folders.');
        error.statusCode = 400;
        error.code = 'INVALID_FOLDER_QUESTION_SELECTION';
        throw error;
      }
    }

    // Check difficulty distribution against available pool first if provided
    if (difficultyDistribution) {
      const reqEasy = parseInt(difficultyDistribution.easy || 0, 10);
      const reqMed = parseInt(difficultyDistribution.medium || 0, 10);
      const reqHard = parseInt(difficultyDistribution.hard || 0, 10);

      const availEasy = poolQuestions.filter((q) => q.difficulty === 'EASY').length;
      const availMed = poolQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
      const availHard = poolQuestions.filter((q) => q.difficulty === 'HARD').length;

      if (reqEasy > availEasy) {
        const error = new Error(`Not enough approved Easy questions in selected chapter(s). Required: ${reqEasy}, Available: ${availEasy}. Please select another chapter or reduce required Easy questions.`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_EASY_QUESTIONS';
        throw error;
      }
      if (reqMed > availMed) {
        const error = new Error(`Not enough approved Medium questions in selected chapter(s). Required: ${reqMed}, Available: ${availMed}. Please select another chapter or reduce required Medium questions.`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_MEDIUM_QUESTIONS';
        throw error;
      }
      if (reqHard > availHard) {
        const error = new Error(`Not enough approved Hard questions in selected chapter(s). Required: ${reqHard}, Available: ${availHard}. Please select another chapter or reduce required Hard questions.`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_HARD_QUESTIONS';
        throw error;
      }
    }

    const perStudent = parseInt(questionsPerStudent, 10) || questionIds.length;
    if (perStudent > questionIds.length) {
      const error = new Error(`Questions per student (${perStudent}) cannot exceed total question pool size (${questionIds.length}).`);
      error.statusCode = 400;
      error.code = 'INVALID_QUESTION_COUNT';
      throw error;
    }

    const cleanFolderIds = effectiveFolderIds.filter((id) => id && id !== 'uncategorized');

    const exam = await Exam.create({
      courseId: course._id,
      institutionId: course.institutionId,
      title: title.trim(),
      description: description ? description.trim() : '',
      duration: dur,
      totalMarks: totMarks,
      passingMarks: passMarks,
      folderIds: cleanFolderIds,
      questionSourceFolders: cleanFolderIds,
      questionIds,
      questionsPerStudent: perStudent,
      difficultyDistribution: difficultyDistribution || { easy: 0, medium: 0, hard: 0 },
      status: 'DRAFT',
      startTime: start,
      endTime: end,
      createdBy: user._id,
    });

    await auditService.logAudit({
      user,
      action: 'EXAM_CREATED',
      resourceType: 'EXAM',
      resourceId: exam._id,
      institutionId: course.institutionId,
      metadata: { examTitle: exam.title, courseCode: course.code },
    });

    return exam.populate('questionIds');
  }

  /**
   * Get exams for instructor's assigned courses with attempt metrics
   */
  async getExamsForInstructor(user, filters = {}) {
    if (user.role !== ROLES.INSTRUCTOR) {
      const error = new Error('Access denied. Only instructors can access instructor exams.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_ROLE';
      throw error;
    }

    // Find assigned courses
    const assignedCourses = await Course.find({ instructorIds: user._id }).select('_id');
    const courseIds = assignedCourses.map((c) => c._id);

    const query = { courseId: { $in: courseIds } };
    if (filters.status) query.status = filters.status;
    if (filters.courseId) query.courseId = filters.courseId;

    const exams = await Exam.find(query)
      .populate('courseId', 'name code department studentIds')
      .populate('questionIds', 'type questionText difficulty')
      .sort({ createdAt: -1 });

    const examIds = exams.map((e) => e._id);
    const attempts = await ExamAttempt.find({ examId: { $in: examIds } });

    const examsWithMetrics = await Promise.all(
      exams.map(async (e) => {
        const eObj = e.toJSON();
        eObj.computedStatus = this.deriveExamStatus(e);

        const eAttempts = attempts.filter((a) => a.examId.toString() === e._id.toString());
        const submittedAttempts = eAttempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'GRADED');

        const lockInfo = await this.checkExamEditLock(e);
        eObj.isLocked = lockInfo.isLocked;
        eObj.lockReason = lockInfo.reason;
        eObj.attemptsStarted = lockInfo.attemptsStarted;
        eObj.canEdit = lockInfo.canEdit;
        eObj.canCancel = lockInfo.canCancel;

        const totalStudents = e.courseId?.studentIds ? e.courseId.studentIds.length : 0;
        const totalScoreSum = submittedAttempts.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
        const avgScore = submittedAttempts.length > 0 ? (totalScoreSum / submittedAttempts.length).toFixed(1) : 0;
        const completionPercentage = totalStudents > 0 ? Math.round((submittedAttempts.length / totalStudents) * 100) : 0;

        eObj.metrics = {
          totalAttempts: eAttempts.length,
          submittedAttempts: submittedAttempts.length,
          totalEnrolledStudents: totalStudents,
          averageScore: parseFloat(avgScore),
          completionPercentage,
        };

        return eObj;
      })
    );

    return examsWithMetrics;
  }

  /**
   * Get all exam attempts for a specific exam for instructor review
   */
  async getInstructorExamAttempts(examId, user) {
    if (user.role !== ROLES.INSTRUCTOR) {
      const error = new Error('Access denied. Only instructors can view exam attempts.');
      error.statusCode = 403;
      throw error;
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      throw error;
    }

    await this.checkInstructorCourseAccess(exam.courseId, user);

    const course = await Course.findById(exam.courseId).populate('studentIds', 'name email rollNumber status');
    const attempts = await ExamAttempt.find({ examId })
      .populate('studentId', 'name email rollNumber status')
      .lean();

    const attemptMap = new Map();
    attempts.forEach((att) => {
      if (att.studentId && att.studentId._id) {
        attemptMap.set(att.studentId._id.toString(), att);
      }
    });

    const enrolledStudents = course ? course.studentIds || [] : [];
    const result = [];

    enrolledStudents.forEach((student) => {
      const att = attemptMap.get(student._id.toString());
      result.push({
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          status: student.status,
        },
        attempt: att || null,
      });
      attemptMap.delete(student._id.toString());
    });

    attemptMap.forEach((att) => {
      result.push({
        student: att.studentId
          ? {
              _id: att.studentId._id,
              name: att.studentId.name,
              email: att.studentId.email,
              rollNumber: att.studentId.rollNumber,
              status: att.studentId.status,
            }
          : { _id: null, name: 'Unknown Student', email: '', rollNumber: '', status: '' },
        attempt: att,
      });
    });

    return result;
  }

  /**
   * Get all students enrolled in courses taught by the instructor
   */
  async getInstructorStudents(user) {
    if (user.role !== ROLES.INSTRUCTOR) {
      const error = new Error('Access denied. Only instructors can view students.');
      error.statusCode = 403;
      throw error;
    }

    const assignedCourses = await Course.find({ instructorIds: user._id })
      .populate('studentIds', 'name email rollNumber status department institutionId')
      .select('_id name code department studentIds');

    const courseIds = assignedCourses.map((c) => c._id);

    const studentCourseMap = new Map();
    const studentInfoMap = new Map();

    assignedCourses.forEach((course) => {
      (course.studentIds || []).forEach((student) => {
        if (!student || !student._id) return;
        const sId = student._id.toString();
        if (!studentInfoMap.has(sId)) {
          studentInfoMap.set(sId, student);
        }
        if (!studentCourseMap.has(sId)) {
          studentCourseMap.set(sId, []);
        }
        studentCourseMap.get(sId).push({
          _id: course._id,
          code: course.code,
          name: course.name,
        });
      });
    });

    const uniqueStudentIds = Array.from(studentInfoMap.keys());

    const attempts = await ExamAttempt.find({
      courseId: { $in: courseIds },
      studentId: { $in: uniqueStudentIds },
    }).select('studentId status totalScore maxScore percentage passed');

    const studentAttemptsMap = new Map();
    attempts.forEach((att) => {
      const sId = att.studentId ? att.studentId.toString() : null;
      if (sId) {
        if (!studentAttemptsMap.has(sId)) {
          studentAttemptsMap.set(sId, []);
        }
        studentAttemptsMap.get(sId).push(att);
      }
    });

    const studentList = uniqueStudentIds.map((sId) => {
      const student = studentInfoMap.get(sId);
      const enrolledCourses = studentCourseMap.get(sId) || [];
      const sAttempts = studentAttemptsMap.get(sId) || [];

      const attemptsCount = sAttempts.length;
      const publishedAttempts = sAttempts.filter((a) => a.status === 'PUBLISHED');
      const scoreSum = publishedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      const averagePublishedScore = publishedAttempts.length > 0 ? Math.round(scoreSum / publishedAttempts.length) : 0;

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber || '',
        status: student.status || 'ACTIVE',
        enrolledCourses,
        attemptsCount,
        averagePublishedScore,
      };
    });

    return studentList;
  }

  /**
   * Get performance metrics and attempt history for a specific student
   */
  async getInstructorStudentPerformance(studentId, user) {
    if (user.role !== ROLES.INSTRUCTOR) {
      const error = new Error('Access denied. Only instructors can view student performance.');
      error.statusCode = 403;
      throw error;
    }

    const assignedCourses = await Course.find({ instructorIds: user._id }).select('_id name code');
    const courseIds = assignedCourses.map((c) => c._id);

    const attempts = await ExamAttempt.find({
      studentId,
      courseId: { $in: courseIds },
    })
      .populate('examId', 'title code totalPoints passPercentage')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    const attemptsCount = attempts.length;
    const completedCount = attempts.filter((a) => ['SUBMITTED', 'GRADED', 'PUBLISHED'].includes(a.status)).length;
    const publishedAttempts = attempts.filter((a) => a.status === 'PUBLISHED');

    const scoreSum = publishedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const averageScore = publishedAttempts.length > 0 ? Math.round(scoreSum / publishedAttempts.length) : 0;

    const passedCount = publishedAttempts.filter((a) => a.passed).length;
    const passRate = publishedAttempts.length > 0 ? Math.round((passedCount / publishedAttempts.length) * 100) : 0;

    return {
      summary: {
        attemptsCount,
        completedCount,
        averageScore,
        passRate,
      },
      attempts: attempts.map((att) => ({
        _id: att._id,
        examId: att.examId ? { _id: att.examId._id, title: att.examId.title } : null,
        courseId: att.courseId ? { _id: att.courseId._id, name: att.courseId.name, code: att.courseId.code } : null,
        status: att.status,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        score: att.totalScore || 0,
        percentage: att.percentage || 0,
        passed: att.passed || false,
      })),
      topics: {
        strongTopics: [],
        weakTopics: [],
      },
    };
  }

  /**
   * Helper to check if exam configuration is locked for editing
   */
  async checkExamEditLock(exam) {
    const now = new Date();
    const startedAttemptsCount = await ExamAttempt.countDocuments({
      examId: exam._id,
      startedAt: { $ne: null },
    });

    const isScheduledOrPublished = exam.status === 'SCHEDULED' || exam.status === 'PUBLISHED';

    if (exam.status === 'DRAFT') {
      return {
        isLocked: false,
        reason: null,
        attemptsStarted: startedAttemptsCount,
        canEdit: true,
        canCancel: true,
      };
    }

    if (isScheduledOrPublished) {
      const hasStartTimePassed = exam.startTime && now >= new Date(exam.startTime);
      if (hasStartTimePassed) {
        return {
          isLocked: true,
          reason: 'Exam configuration cannot be changed because the scheduled start time has passed.',
          attemptsStarted: startedAttemptsCount,
          canEdit: false,
          canCancel: startedAttemptsCount === 0,
        };
      }

      if (startedAttemptsCount > 0) {
        return {
          isLocked: true,
          reason: 'Exam configuration cannot be changed because a student has already started an attempt.',
          attemptsStarted: startedAttemptsCount,
          canEdit: false,
          canCancel: false,
        };
      }

      return {
        isLocked: false,
        reason: null,
        attemptsStarted: 0,
        canEdit: true,
        canCancel: true,
      };
    }

    return {
      isLocked: true,
      reason: `Exam configuration cannot be changed because the exam status is ${exam.status}.`,
      attemptsStarted: startedAttemptsCount,
      canEdit: false,
      canCancel: false,
    };
  }

  /**
   * Get exam by ID with role check
   */
  async getExamById(examId, user) {
    const exam = await Exam.findById(examId)
      .populate('courseId', 'name code department studentIds instructorIds')
      .populate('questionIds');

    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      error.code = 'EXAM_NOT_FOUND';
      throw error;
    }

    if (user.role === ROLES.INSTRUCTOR) {
      const isAssigned = exam.courseId.instructorIds.some((id) => id.toString() === user._id.toString());
      if (!isAssigned) {
        const error = new Error('Access denied. You are not assigned to this course exam.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ACCESS';
        throw error;
      }
    } else if (user.role === ROLES.STUDENT) {
      const isEnrolled = exam.courseId.studentIds.some((id) => id.toString() === user._id.toString());
      if (!isEnrolled) {
        const error = new Error('Access denied. You are not enrolled in this course.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ACCESS';
        throw error;
      }
      if (exam.status === 'DRAFT' || exam.status === 'ARCHIVED') {
        const error = new Error('Access denied. Exam is not published.');
        error.statusCode = 403;
        error.code = 'EXAM_NOT_PUBLISHED';
        throw error;
      }
    }

    const lockInfo = await this.checkExamEditLock(exam);
    const eObj = exam.toJSON();
    eObj.computedStatus = this.deriveExamStatus(exam);
    eObj.isLocked = lockInfo.isLocked;
    eObj.lockReason = lockInfo.reason;
    eObj.attemptsStarted = lockInfo.attemptsStarted;
    eObj.canEdit = lockInfo.canEdit;
    eObj.canCancel = lockInfo.canCancel;
    return eObj;
  }

  /**
   * Update exam details
   */
  async updateExam(examId, updateData, user) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      error.code = 'EXAM_NOT_FOUND';
      throw error;
    }

    await this.checkInstructorCourseAccess(exam.courseId, user);

    const lockInfo = await this.checkExamEditLock(exam);

    // Cancel action check
    if (updateData.status === 'CANCELLED' && Object.keys(updateData).filter(k => k !== 'status').length === 0) {
      if (lockInfo.attemptsStarted > 0) {
        const error = new Error('Exam configuration cannot be changed because a student has already started an attempt.');
        error.statusCode = 409;
        error.code = 'EXAM_LOCKED';
        throw error;
      }
      exam.status = 'CANCELLED';
      await exam.save();

      await auditService.logAudit({
        user,
        action: 'EXAM_CANCELLED',
        resourceType: 'EXAM',
        resourceId: exam._id,
        institutionId: exam.institutionId,
        metadata: { examTitle: exam.title },
      });

      return exam.populate('questionIds');
    }

    // Configuration modification lock check
    if (lockInfo.isLocked) {
      const error = new Error(lockInfo.reason || 'Exam configuration cannot be changed because a student has already started an attempt.');
      error.statusCode = 409;
      error.code = 'EXAM_LOCKED';
      throw error;
    }

    // Track changed fields for Audit Log (Section 11)
    const oldValues = {};
    const newValues = {};
    const changedFields = [];

    const fieldsToTrack = [
      'title',
      'description',
      'duration',
      'totalMarks',
      'passingMarks',
      'questionsPerStudent',
      'difficultyDistribution',
      'startTime',
      'endTime',
      'questionIds',
      'folderIds',
      'questionSourceFolders',
      'status',
    ];

    fieldsToTrack.forEach((field) => {
      if (updateData[field] !== undefined) {
        let oldVal = exam[field];
        let newVal = updateData[field];

        if (field === 'startTime' || field === 'endTime') {
          oldVal = oldVal ? new Date(oldVal).toISOString() : null;
          newVal = newVal ? new Date(newVal).toISOString() : null;
        } else if (Array.isArray(oldVal)) {
          oldVal = oldVal.map((id) => (id ? id.toString() : ''));
          newVal = Array.isArray(newVal) ? newVal.map((id) => (id ? id.toString() : '')) : newVal;
        }

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changedFields.push(field);
          oldValues[field] = oldVal;
          newValues[field] = newVal;
        }
      }
    });

    if (updateData.title) exam.title = updateData.title.trim();
    if (updateData.description !== undefined) exam.description = updateData.description.trim();
    if (updateData.duration) {
      const dur = parseInt(updateData.duration, 10);
      if (dur <= 0) {
        const error = new Error('Exam duration must be greater than 0 minutes.');
        error.statusCode = 400;
        error.code = 'INVALID_DURATION';
        throw error;
      }
      exam.duration = dur;
    }
    if (updateData.totalMarks) exam.totalMarks = parseInt(updateData.totalMarks, 10);
    if (updateData.passingMarks) {
      const passMarks = parseInt(updateData.passingMarks, 10);
      if (passMarks > (exam.totalMarks || 100)) {
        const error = new Error('Passing marks cannot be greater than total marks.');
        error.statusCode = 400;
        error.code = 'INVALID_PASSING_MARKS';
        throw error;
      }
      exam.passingMarks = passMarks;
    }

    if (Array.isArray(updateData.questionIds)) exam.questionIds = updateData.questionIds;
    if (Array.isArray(updateData.folderIds)) {
      exam.folderIds = updateData.folderIds;
      exam.questionSourceFolders = updateData.folderIds;
    }
    if (Array.isArray(updateData.questionSourceFolders)) exam.questionSourceFolders = updateData.questionSourceFolders;
    if (updateData.questionsPerStudent !== undefined) exam.questionsPerStudent = parseInt(updateData.questionsPerStudent, 10) || 0;
    if (updateData.difficultyDistribution) exam.difficultyDistribution = updateData.difficultyDistribution;
    if (updateData.status) exam.status = updateData.status;

    const newStart = updateData.startTime !== undefined ? (updateData.startTime ? parseISTDateTime(updateData.startTime) : null) : exam.startTime;
    const newEnd = updateData.endTime !== undefined ? (updateData.endTime ? parseISTDateTime(updateData.endTime) : null) : exam.endTime;

    if (newStart && newEnd && newStart >= newEnd) {
      const error = new Error('Exam start time must be before end time.');
      error.statusCode = 400;
      error.code = 'INVALID_EXAM_SCHEDULE';
      throw error;
    }

    exam.startTime = newStart;
    exam.endTime = newEnd;

    await exam.save();

    await auditService.logAudit({
      user,
      action: updateData.status === 'CANCELLED' ? 'EXAM_CANCELLED' : 'EXAM_UPDATED',
      resourceType: 'EXAM',
      resourceId: exam._id,
      institutionId: exam.institutionId,
      metadata: {
        examTitle: exam.title,
        changedFields,
        oldValues,
        newValues,
      },
    });

    return exam.populate('questionIds');
  }

  /**
   * Publish exam for student access with strict validation
   */
  async publishExam(examId, user) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      error.code = 'EXAM_NOT_FOUND';
      throw error;
    }

    await this.checkInstructorCourseAccess(exam.courseId, user);

    if (!exam.questionIds || exam.questionIds.length === 0) {
      const error = new Error('Cannot publish an exam with no questions. Please add approved questions first.');
      error.statusCode = 400;
      error.code = 'EMPTY_EXAM';
      throw error;
    }

    const poolQuestions = await Question.find({
      _id: { $in: exam.questionIds },
      courseId: exam.courseId,
    });

    if (poolQuestions.length !== exam.questionIds.length) {
      const error = new Error('One or more selected questions do not belong to this course.');
      error.statusCode = 400;
      error.code = 'INVALID_QUESTION_SELECTION';
      throw error;
    }

    const unapproved = poolQuestions.find((q) => q.status !== 'APPROVED');
    if (unapproved) {
      const error = new Error(`Cannot publish exam: Question "${unapproved.questionText.substring(0, 30)}..." is not approved. Only APPROVED questions can be published.`);
      error.statusCode = 400;
      error.code = 'UNAPPROVED_QUESTION_SELECTION';
      throw error;
    }

    const perStudent = exam.questionsPerStudent || poolQuestions.length;
    if (perStudent > poolQuestions.length) {
      const error = new Error(`Cannot publish exam: Questions per student (${perStudent}) cannot exceed total approved question pool size (${poolQuestions.length}).`);
      error.statusCode = 400;
      error.code = 'INVALID_QUESTION_COUNT';
      throw error;
    }

    const dist = exam.difficultyDistribution;
    if (dist && (dist.easy > 0 || dist.medium > 0 || dist.hard > 0)) {
      const reqEasy = dist.easy || 0;
      const reqMed = dist.medium || 0;
      const reqHard = dist.hard || 0;
      const sum = reqEasy + reqMed + reqHard;

      if (perStudent > 0 && sum !== perStudent) {
        const error = new Error(`Cannot publish exam: Difficulty distribution sum (${sum} = ${reqEasy} Easy + ${reqMed} Medium + ${reqHard} Hard) must equal questions per student (${perStudent}).`);
        error.statusCode = 400;
        error.code = 'INVALID_DIFFICULTY_DISTRIBUTION';
        throw error;
      }

      const availEasy = poolQuestions.filter((q) => q.difficulty === 'EASY').length;
      const availMed = poolQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
      const availHard = poolQuestions.filter((q) => q.difficulty === 'HARD').length;

      if (reqEasy > availEasy) {
        const error = new Error(`Cannot publish exam: ${reqEasy} Easy question(s) required, but only ${availEasy} approved Easy question(s) available.`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_EASY_QUESTIONS';
        throw error;
      }
      if (reqMed > availMed) {
        const error = new Error(`Cannot publish exam: ${reqMed} Medium question(s) required, but only ${availMed} approved Medium question(s) available.`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_MEDIUM_QUESTIONS';
        throw error;
      }
      if (reqHard > availHard) {
        const error = new Error(`Cannot publish exam: ${reqHard} Hard question(s) required, but only ${availHard} approved Hard question(s) available.`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_HARD_QUESTIONS';
        throw error;
      }
    }

    if (exam.startTime && exam.endTime && new Date(exam.startTime) >= new Date(exam.endTime)) {
      const error = new Error('Cannot publish exam: Exam start time must be strictly before end time.');
      error.statusCode = 400;
      error.code = 'INVALID_EXAM_SCHEDULE';
      throw error;
    }

    const now = new Date();
    if (exam.startTime && now < new Date(exam.startTime)) {
      exam.status = 'SCHEDULED';
    } else {
      exam.status = 'PUBLISHED';
    }

    await exam.save();

    // Dispatch Exam Notification Emails to Enrolled Students
    const notificationSummary = await this.dispatchExamPublishedNotifications({ exam });

    await auditService.logAudit({
      user,
      action: 'EXAM_PUBLISHED',
      resourceType: 'EXAM',
      resourceId: exam._id,
      institutionId: exam.institutionId,
      metadata: { examTitle: exam.title, notificationSummary },
    });

    const populatedExam = await exam.populate('questionIds');
    const examObj = populatedExam.toJSON();
    examObj.notificationSummary = notificationSummary;
    return examObj;
  }

  /**
   * Helper to send exam publication notification emails to all enrolled students
   */
  async dispatchExamPublishedNotifications({ exam, forceResend = false }) {
    try {
      const course = await Course.findById(exam.courseId).populate('studentIds');
      if (!course || !Array.isArray(course.studentIds) || course.studentIds.length === 0) {
        return {
          totalEnrolled: 0,
          sentCount: 0,
          skippedCount: 0,
          failedCount: 0,
          recipients: [],
        };
      }

      const enrolledStudents = course.studentIds.filter((s) => s && s.role === ROLES.STUDENT && s.status === 'ACTIVE');
      const Notification = require('../models/Notification');

      const examDetails = {
        title: exam.title,
        courseName: course.name,
        courseCode: course.code,
        examDate: exam.startTime ? formatExamDate(exam.startTime) : 'Flexible / Active',
        startTime: exam.startTime ? formatExamTime(exam.startTime) : 'Immediate',
        endTime: exam.endTime ? formatExamTime(exam.endTime) : 'N/A',
        durationMinutes: exam.duration,
        totalQuestions: exam.questionsPerStudent || (exam.questionIds ? exam.questionIds.length : 0),
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
      };

      const results = {
        totalEnrolled: enrolledStudents.length,
        sentCount: 0,
        skippedCount: 0,
        failedCount: 0,
        recipients: [],
      };

      for (const student of enrolledStudents) {
        if (!student.email) continue;

        // Idempotency check: avoid duplicate emails unless forceResend is requested
        if (!forceResend) {
          const existingNotification = await Notification.findOne({
            studentId: student._id,
            relatedId: exam._id,
            type: 'EXAM_PUBLISHED',
            status: 'SENT',
          });
          if (existingNotification) {
            results.skippedCount++;
            results.recipients.push({ email: student.email, status: 'SKIPPED_DUPLICATE' });
            continue;
          }
        }

        const emailRes = await emailService.sendExamPublishedEmail({
          to: student.email,
          studentName: student.name,
          examDetails,
        });

        const status = emailRes.success ? 'SENT' : 'FAILED';
        const failureReason = emailRes.error || null;

        await Notification.create({
          studentId: student._id,
          recipientEmail: student.email,
          type: 'EXAM_PUBLISHED',
          title: `Exam Announcement: ${exam.title}`,
          message: `Notification email for exam "${exam.title}" sent to ${student.email}`,
          read: false,
          relatedId: exam._id,
          status,
          failureReason,
        });

        if (emailRes.success) {
          results.sentCount++;
          results.recipients.push({ email: student.email, status: 'SENT' });
        } else {
          results.failedCount++;
          results.recipients.push({ email: student.email, status: 'FAILED', reason: failureReason });
        }
      }

      return results;
    } catch (err) {
      console.error('[Exam Notification Error] Failed dispatching notifications:', err.message);
      return { error: err.message };
    }
  }

  /**
   * Resend exam publication notification to enrolled students
   */
  async resendExamNotification(examId, user) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found.');
      error.statusCode = 404;
      error.code = 'EXAM_NOT_FOUND';
      throw error;
    }

    if (user.role === ROLES.INSTRUCTOR) {
      await this.checkInstructorCourseAccess(exam.courseId, user);
    } else if (user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.INSTITUTION_ADMIN) {
      const error = new Error('Access denied. Only instructors and administrators can resend exam notifications.');
      error.statusCode = 403;
      throw error;
    }

    const summary = await this.dispatchExamPublishedNotifications({ exam, forceResend: true });
    return {
      success: true,
      message: `Exam notification dispatch complete. Sent: ${summary.sentCount}, Failed: ${summary.failedCount}, Total Enrolled: ${summary.totalEnrolled}.`,
      summary,
    };
  }

  /**
   * Get exams available to logged-in student
   */
  async getStudentExams(user) {
    if (user.role !== ROLES.STUDENT) {
      const error = new Error('Access denied. Only students can access student exams.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_ROLE';
      throw error;
    }

    // Find courses student is enrolled in
    const enrolledCourses = await Course.find({ studentIds: user._id }).select('_id name code department');
    const courseIds = enrolledCourses.map((c) => c._id);

    const exams = await Exam.find({
      courseId: { $in: courseIds },
      status: { $in: ['PUBLISHED', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'ENDED'] },
    })
      .populate('courseId', 'name code department')
      .populate('questionIds', 'type questionText options difficulty')
      .sort({ createdAt: -1 });

    const examIds = exams.map((e) => e._id);
    const attempts = await ExamAttempt.find({ examId: { $in: examIds }, studentId: user._id });

    // Filter exams by institution, enrollment is already checked via courseIds
    // Also enforce end time window unless the student already has an attempt
    // Note: Future exams (SCHEDULED) are kept visible so they can be displayed as "Upcoming"
    const validExams = exams.filter(e => {
      if (e.institutionId && user.institutionId && e.institutionId.toString() !== user.institutionId.toString()) return false;
      
      const hasAttempt = attempts.some(a => a.examId.toString() === e._id.toString());
      if (hasAttempt) return true;

      const now = new Date();
      if (e.endTime && now > new Date(e.endTime)) return false;
      
      return true;
    });

    const studentExams = validExams.map((e) => {
      const eObj = e.toJSON();
      eObj.computedStatus = this.deriveExamStatus(e);

      const myAttempt = attempts.find((a) => a.examId.toString() === e._id.toString());

      eObj.myAttempt = myAttempt
        ? {
            id: myAttempt._id,
            status: myAttempt.status,
            totalScore: myAttempt.status === 'PUBLISHED' ? myAttempt.totalScore : undefined,
            percentage: myAttempt.status === 'PUBLISHED' ? myAttempt.percentage : undefined,
            passed: myAttempt.status === 'PUBLISHED' ? myAttempt.passed : undefined,
            submittedAt: myAttempt.submittedAt,
          }
        : null;

      return eObj;
    });

    return {
      exams: studentExams,
      enrolledSubjectsCount: courseIds.length
    };
  }

  /**
   * Start or resume an exam attempt for student with server-side question randomization and persistence
   */
  async startExamAttempt(examId, user) {
    try {
      if (user.role !== ROLES.STUDENT) {
        const error = new Error('Only students can attempt official exams.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_ROLE';
        throw error;
      }

      const exam = await Exam.findById(examId).populate('courseId').populate('questionIds');
      if (!exam) {
        const error = new Error('Exam not found.');
        error.statusCode = 404;
        error.code = 'EXAM_NOT_FOUND';
        throw error;
      }

      // Authorization checks
      const isEnrolled = exam.courseId.studentIds.some((id) => id.toString() === user._id.toString());
      if (!isEnrolled) {
        const error = new Error('Access denied. You are not enrolled in the course for this exam.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ENROLLMENT';
        throw error;
      }

      if (!['PUBLISHED', 'SCHEDULED', 'ACTIVE'].includes(exam.status)) {
        const error = new Error('Exam is not currently active for student access.');
        error.statusCode = 400;
        error.code = 'EXAM_NOT_ACTIVE';
        throw error;
      }

      // Schedule check
      const now = new Date();
      if (exam.startTime && now < new Date(exam.startTime)) {
        const error = new Error(`Exam has not started yet. Scheduled start time: ${formatExamDateTime(exam.startTime)}`);
        error.statusCode = 400;
        error.code = 'EXAM_NOT_STARTED';
        throw error;
      }
      if (exam.endTime && now > new Date(exam.endTime)) {
        const error = new Error('Exam schedule has closed.');
        error.statusCode = 400;
        error.code = 'EXAM_CLOSED';
        throw error;
      }

      // Check existing attempt
      let attempt = await ExamAttempt.findOne({ examId: exam._id, studentId: user._id });

      if (attempt) {
        if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
          const error = new Error('You have already submitted this exam.');
          error.statusCode = 400;
          error.code = 'ATTEMPT_ALREADY_SUBMITTED';
          throw error;
        }
      } else {
        // Server-side difficulty-aware question randomization from APPROVED pool
        const rawQuestionIds = (exam.questionIds || []).map((q) => q._id || q);
        const courseIdStr = exam.courseId._id ? exam.courseId._id.toString() : exam.courseId.toString();

        const pool = await Question.find({
          _id: { $in: rawQuestionIds },
          courseId: courseIdStr,
          status: 'APPROVED',
        });

        if (pool.length === 0) {
          const error = new Error('Exam question pool contains no approved questions for this course.');
          error.statusCode = 400;
          error.code = 'EMPTY_APPROVED_POOL';
          throw error;
        }

        let selectedQuestions = [];
        const dist = exam.difficultyDistribution;
        const hasDist = dist && (dist.easy > 0 || dist.medium > 0 || dist.hard > 0);

        const shuffle = (arr) => {
          const array = [...arr];
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array;
        };

        if (hasDist) {
          const easyPool = pool.filter((q) => q.difficulty === 'EASY');
          const medPool = pool.filter((q) => q.difficulty === 'MEDIUM');
          const hardPool = pool.filter((q) => q.difficulty === 'HARD');

          const pickedEasy = shuffle(easyPool).slice(0, dist.easy || 0);
          const pickedMed = shuffle(medPool).slice(0, dist.medium || 0);
          const pickedHard = shuffle(hardPool).slice(0, dist.hard || 0);

          selectedQuestions = shuffle([...pickedEasy, ...pickedMed, ...pickedHard]);
        } else if (exam.questionsPerStudent > 0 && exam.questionsPerStudent < pool.length) {
          selectedQuestions = shuffle(pool).slice(0, exam.questionsPerStudent);
        } else {
          selectedQuestions = shuffle(pool);
        }

        // Guarantee unique question IDs
        const selectedIds = [...new Set(selectedQuestions.map((q) => q._id.toString()))];

        attempt = await ExamAttempt.create({
          examId: exam._id,
          courseId: exam.courseId._id || exam.courseId,
          institutionId: exam.institutionId._id || exam.institutionId,
          studentId: user._id,
          questionIds: selectedIds,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        });
      }

      // Load persisted question set for attempt — NO correct answers or explanations exposed to student
      const safeAttemptQuestionIds = (attempt.questionIds && attempt.questionIds.length > 0
        ? attempt.questionIds
        : (exam.questionIds || []).map((q) => q._id || q)
      ).map((id) => (id._id ? id._id.toString() : id.toString()));

      const courseIdStr = exam.courseId._id ? exam.courseId._id.toString() : exam.courseId.toString();

      const assignedQuestions = await Question.find({
        _id: { $in: safeAttemptQuestionIds },
        courseId: courseIdStr,
        status: 'APPROVED',
      }).select('type questionText options difficulty topic');

      const examResponse = exam.toJSON();
      examResponse.questionIds = assignedQuestions;
      examResponse.computedStatus = this.deriveExamStatus(exam);

      return {
        attempt,
        exam: examResponse,
      };
    } catch (err) {
      console.error('[START_EXAM_ATTEMPT_ERROR]', err);
      throw err;
    }
  }

  /**
   * Submit exam attempt, grade automatically, and generate AI performance analysis
   */
  async submitExamAttempt(attemptId, answers = [], user) {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      const error = new Error('Exam attempt not found.');
      error.statusCode = 404;
      error.code = 'ATTEMPT_NOT_FOUND';
      throw error;
    }

    if (attempt.studentId.toString() !== user._id.toString()) {
      const error = new Error('Access denied. Attempt belongs to a different student.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_ATTEMPT_ACCESS';
      throw error;
    }

    if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      return attempt;
    }

    const exam = await Exam.findById(attempt.examId).populate('questionIds');
    if (!exam) {
      const error = new Error('Associated exam not found.');
      error.statusCode = 404;
      error.code = 'EXAM_NOT_FOUND';
      throw error;
    }

    // Auto-grading logic
    let totalScore = 0;
    const gradedAnswers = [];
    const topicPerformance = {};

    const safeAttemptQuestionIds = attempt.questionIds && attempt.questionIds.length > 0
      ? attempt.questionIds.map(id => id.toString())
      : exam.questionIds.map(q => q._id.toString());

    const assignedQuestions = exam.questionIds.filter(q => safeAttemptQuestionIds.includes(q._id.toString()));
    const questionsMap = new Map(assignedQuestions.map((q) => [q._id.toString(), q]));
    const totalQuestions = assignedQuestions.length || 1;
    const pointsPerQuestion = (exam.totalMarks || 100) / totalQuestions;

    for (const ans of answers) {
      if (!safeAttemptQuestionIds.includes(String(ans.questionId))) continue;

      const q = questionsMap.get(String(ans.questionId));
      if (q) {
        let isCorrect = false;
        let marks = 0;

        if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
          if (ans.selectedOption && ans.selectedOption.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            isCorrect = true;
            marks = pointsPerQuestion;
          }
        } else if (q.type === 'SHORT_ANSWER') {
          if (ans.textAnswer && ans.textAnswer.trim().length > 3) {
            isCorrect = true;
            marks = pointsPerQuestion;
          }
        }

        totalScore += marks;

        gradedAnswers.push({
          questionId: q._id,
          selectedOption: ans.selectedOption || '',
          textAnswer: ans.textAnswer || '',
          isCorrect,
          marksObtained: Math.round(marks),
        });

        // Track topic breakdown for AI feedback
        const topic = q.topic || 'General';
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { total: 0, correct: 0 };
        }
        topicPerformance[topic].total += 1;
        if (isCorrect) topicPerformance[topic].correct += 1;
      }
    }

    const finalScore = Math.round(totalScore);
    const percentage = Math.round((finalScore / (exam.totalMarks || 100)) * 100);
    const passed = finalScore >= (exam.passingMarks || 40);

    // AI Performance Analysis
    const strengths = [];
    const weakTopics = [];
    for (const [top, perf] of Object.entries(topicPerformance)) {
      if (perf.correct / perf.total >= 0.7) {
        strengths.push(`Strong understanding of ${top}`);
      } else {
        weakTopics.push(top);
      }
    }

    const recommendations = weakTopics.map((top) => `Review course materials and practice questions on ${top}.`);
    if (recommendations.length === 0) {
      recommendations.push('Excellent mastery of course topics! Continue maintaining consistency.');
    }

    attempt.answers = gradedAnswers;
    attempt.totalScore = finalScore;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.status = 'GRADED';
    attempt.submittedAt = new Date();
    attempt.aiAnalysis = {
      strengths: strengths.length > 0 ? strengths : ['Demonstrated fundamental course comprehension'],
      weakTopics: weakTopics.length > 0 ? weakTopics : [],
      recommendations,
    };

    try {
      const summaryResult = await integrityService.generateAIIntegritySummary(
        exam.title,
        attempt.integritySignals || [],
        attempt.questionTimings || []
      );
      attempt.integritySummary = {
        totalSignals: summaryResult.totalSignals,
        riskLevel: summaryResult.riskLevel,
        signalCounts: summaryResult.signalCounts,
        aiSummary: summaryResult.aiSummary,
        aiRecommendation: summaryResult.aiRecommendation,
        reviewStatus: 'PENDING',
      };
    } catch (e) {
      console.error('Integrity summary generation error:', e);
    }

    await attempt.save();

    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        studentId: user._id,
        type: 'EXAM_SUBMITTED',
        title: 'Exam Submitted Successfully',
        message: `Your attempt for "${exam.title}" has been successfully submitted and is under review.`,
        relatedId: exam._id
      });
    } catch (e) { console.error('Notification creation failed', e); }

    const result = attempt.toJSON();
    delete result.totalScore;
    delete result.percentage;
    delete result.passed;
    delete result.answers;
    delete result.aiAnalysis;

    await auditService.logAudit({
      user,
      action: 'EXAM_SUBMITTED',
      resourceType: 'EXAM_ATTEMPT',
      resourceId: attempt._id,
      institutionId: attempt.institutionId,
      metadata: { examTitle: exam.title, score: finalScore, percentage },
    });

    return result;
  }

  /**
   * Save exam attempt progress without submitting
   */
  async saveExamAttemptProgress(attemptId, answers = [], user) {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      const error = new Error('Exam attempt not found.');
      error.statusCode = 404;
      throw error;
    }

    if (attempt.studentId.toString() !== user._id.toString()) {
      const error = new Error('Access denied.');
      error.statusCode = 403;
      throw error;
    }

    if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      return attempt;
    }

    const savedAnswers = [];
    for (const ans of answers) {
      savedAnswers.push({
        questionId: ans.questionId,
        selectedOption: ans.selectedOption || '',
        textAnswer: ans.textAnswer || '',
      });
    }

    attempt.answers = savedAnswers;
    await attempt.save();

    return attempt;
  }

  /**
   * Get real MongoDB analytics for instructor workspace
   */
  async getInstructorAnalytics(user) {
    if (user.role !== ROLES.INSTRUCTOR) {
      const error = new Error('Access denied.');
      error.statusCode = 403;
      throw error;
    }

    const assignedCourses = await Course.find({ instructorIds: user._id }).select('_id name code department studentIds');
    const courseIds = assignedCourses.map((c) => c._id);

    const [materialsCount, questionsCount, approvedQuestionsCount, exams, attempts, publishedAttempts] = await Promise.all([
      CourseMaterial.countDocuments({ courseId: { $in: courseIds } }),
      Question.countDocuments({ courseId: { $in: courseIds } }),
      Question.countDocuments({ courseId: { $in: courseIds }, status: 'APPROVED' }),
      Exam.find({ courseId: { $in: courseIds } }).select('_id title status'),
      ExamAttempt.find({ courseId: { $in: courseIds }, status: { $in: ['SUBMITTED', 'GRADED'] } }),
      ExamAttempt.countDocuments({ courseId: { $in: courseIds }, status: 'PUBLISHED' }),
    ]);

    const totalStudents = assignedCourses.reduce((acc, curr) => acc + (curr.studentIds ? curr.studentIds.length : 0), 0);
    const scoreSum = attempts.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
    const averageScore = attempts.length > 0 ? (scoreSum / attempts.length).toFixed(1) : 0;

    return {
      stats: {
        coursesCount: assignedCourses.length,
        materialsCount,
        questionsCount,
        approvedQuestionsCount,
        examsCreatedCount: exams.length,
        totalStudentsCount: totalStudents,
        totalSubmittedAttempts: attempts.length,
        averageClassScore: parseFloat(averageScore),
        pendingReviewsCount: attempts.length,
        publishedResultsCount: publishedAttempts,
      },
      assignedCourses: assignedCourses.map((c) => ({
        id: c._id,
        code: c.code,
        name: c.name,
        department: c.department,
        studentCount: c.studentIds ? c.studentIds.length : 0,
      })),
    };
  }

  /**
   * Get detailed analytics for Instructor Analytics Workspace (calculates score distribution, difficulty analysis, question analysis, unit performance, exam breakdown)
   */
  async getInstructorAnalyticsDetails(user, filters = {}) {
    if (user.role !== ROLES.INSTRUCTOR) {
      const error = new Error('Access denied.');
      error.statusCode = 403;
      throw error;
    }

    const assignedCourses = await Course.find({ instructorIds: user._id })
      .populate('studentIds', 'name email')
      .select('_id name code department studentIds');
    const assignedCourseIds = assignedCourses.map((c) => c._id.toString());

    // Fetch all accessible exams for filter dropdown options
    const allInstructorExams = await Exam.find({ courseId: { $in: assignedCourseIds } })
      .select('_id title courseId')
      .lean();

    const formattedCourses = assignedCourses.map((c) => ({
      _id: c._id.toString(),
      code: c.code,
      name: c.name,
    }));

    const formattedExams = allInstructorExams.map((e) => ({
      _id: e._id.toString(),
      title: e.title,
      courseId: e.courseId ? e.courseId.toString() : null,
    }));

    // Course filter
    let courseIds = assignedCourseIds;
    if (filters.courseId) {
      if (!assignedCourseIds.includes(filters.courseId)) {
        const error = new Error('Access denied. Course is not assigned to you.');
        error.statusCode = 403;
        throw error;
      }
      courseIds = [filters.courseId];
    }

    // Exam filter
    const examQuery = { courseId: { $in: courseIds } };
    if (filters.examId) {
      examQuery._id = filters.examId;
    }

    const exams = await Exam.find(examQuery)
      .populate('questionIds')
      .populate('courseId', 'code name studentIds');

    const examIds = exams.map((e) => e._id);

    // Attempt filter
    const attemptQuery = { examId: { $in: examIds }, status: { $in: ['SUBMITTED', 'GRADED', 'PUBLISHED'] } };
    if (filters.startDate || filters.endDate) {
      attemptQuery.createdAt = {};
      if (filters.startDate) attemptQuery.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) attemptQuery.createdAt.$lte = new Date(filters.endDate);
    }

    const attempts = await ExamAttempt.find(attemptQuery).populate('answers.questionId');

    // Total unique students across filtered courses
    const targetCourses = assignedCourses.filter((c) => courseIds.includes(c._id.toString()));
    const totalStudents = [...new Set(targetCourses.flatMap((c) => (c.studentIds || []).map((s) => s._id.toString())))].length;

    if (attempts.length === 0) {
      return {
        hasData: false,
        summary: {
          totalStudents,
          submittedCount: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passRate: 0,
        },
        courses: formattedCourses,
        exams: formattedExams,
        scoreDistribution: [],
        questionAnalysis: [],
        difficultyAnalysis: [],
        topicPerformance: [],
        examPerformance: [],
      };
    }

    // Summary calculations
    const percentages = attempts.map((a) => a.percentage || 0);
    const submittedCount = attempts.length;
    const scoreSum = percentages.reduce((a, b) => a + b, 0);
    const averageScore = parseFloat((scoreSum / submittedCount).toFixed(1));
    const highestScore = Math.max(...percentages);
    const lowestScore = Math.min(...percentages);
    const passedCount = attempts.filter((a) => a.passed).length;
    const passRate = Math.round((passedCount / submittedCount) * 100);

    // 1. Score Distribution (0-20, 20-40, 40-60, 60-80, 80-100)
    const ranges = [
      { range: '0–20', min: 0, max: 20, count: 0 },
      { range: '20–40', min: 20, max: 40, count: 0 },
      { range: '40–60', min: 40, max: 60, count: 0 },
      { range: '60–80', min: 60, max: 80, count: 0 },
      { range: '80–100', min: 80, max: 100, count: 0 },
    ];

    percentages.forEach((p) => {
      if (p <= 20) ranges[0].count++;
      else if (p <= 40) ranges[1].count++;
      else if (p <= 60) ranges[2].count++;
      else if (p <= 80) ranges[3].count++;
      else ranges[4].count++;
    });

    const maxCount = Math.max(...ranges.map((r) => r.count), 1);
    const scoreDistribution = ranges.map((r) => ({
      ...r,
      percentageHeight: Math.round((r.count / maxCount) * 100),
    }));

    // 2. Question Analysis
    const questionStatsMap = {};
    attempts.forEach((att) => {
      (att.answers || []).forEach((ans) => {
        const qId = ans.questionId?._id?.toString() || ans.questionId?.toString();
        if (!qId) return;

        if (!questionStatsMap[qId]) {
          const questionObj = ans.questionId && ans.questionId.questionText ? ans.questionId : null;
          questionStatsMap[qId] = {
            id: qId,
            questionText: questionObj ? questionObj.questionText : 'Question',
            type: questionObj ? questionObj.type : 'MCQ',
            difficulty: questionObj ? questionObj.difficulty : 'MEDIUM',
            topic: questionObj ? questionObj.topic : 'General',
            totalResponses: 0,
            correctResponses: 0,
          };
        }

        questionStatsMap[qId].totalResponses++;
        if (ans.isCorrect) questionStatsMap[qId].correctResponses++;
      });
    });

    const questionAnalysis = Object.values(questionStatsMap).map((q) => ({
      ...q,
      correctPct: q.totalResponses > 0 ? Math.round((q.correctResponses / q.totalResponses) * 100) : 0,
    }));

    // 3. Difficulty Analysis (EASY, MEDIUM, HARD)
    const diffMap = { EASY: { count: 0, correct: 0 }, MEDIUM: { count: 0, correct: 0 }, HARD: { count: 0, correct: 0 } };
    questionAnalysis.forEach((q) => {
      const d = ['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty) ? q.difficulty : 'MEDIUM';
      diffMap[d].count += q.totalResponses;
      diffMap[d].correct += q.correctResponses;
    });

    const difficultyAnalysis = Object.keys(diffMap).map((d) => ({
      difficulty: d,
      totalResponses: diffMap[d].count,
      correctPct: diffMap[d].count > 0 ? Math.round((diffMap[d].correct / diffMap[d].count) * 100) : 0,
    }));

    // 4. Topic Performance
    const topicMap = {};
    questionAnalysis.forEach((q) => {
      const t = q.topic || 'General';
      if (!topicMap[t]) topicMap[t] = { topic: t, totalResponses: 0, correctResponses: 0, questionCount: 0 };
      topicMap[t].questionCount++;
      topicMap[t].totalResponses += q.totalResponses;
      topicMap[t].correctResponses += q.correctResponses;
    });

    const topicPerformance = Object.values(topicMap).map((t) => ({
      ...t,
      correctPct: t.totalResponses > 0 ? Math.round((t.correctResponses / t.totalResponses) * 100) : 0,
    }));

    // 5. Exam Breakdown
    const examPerformance = exams.map((e) => {
      const eAttempts = attempts.filter((a) => a.examId.toString() === e._id.toString());
      const eScores = eAttempts.map((a) => a.percentage || 0);
      const eAvg = eScores.length > 0 ? parseFloat((eScores.reduce((a, b) => a + b, 0) / eScores.length).toFixed(1)) : 0;
      const ePassed = eAttempts.filter((a) => a.passed).length;
      const ePassRate = eScores.length > 0 ? Math.round((ePassed / eScores.length) * 100) : 0;
      const eEnrolled = e.courseId?.studentIds?.length || 0;

      return {
        id: e._id,
        title: e.title,
        courseCode: e.courseId?.code || 'N/A',
        enrolledStudents: eEnrolled,
        attemptsCount: eAttempts.length,
        averageScore: eAvg,
        passRate: ePassRate,
      };
    });

    return {
      hasData: true,
      summary: {
        totalStudents,
        submittedCount,
        averageScore,
        highestScore,
        lowestScore,
        passRate,
      },
      courses: formattedCourses,
      exams: formattedExams,
      scoreDistribution,
      questionAnalysis,
      difficultyAnalysis,
      topicPerformance,
      examPerformance,
    };
  }

  /**
   * Generate Instructor Reports (Student Performance, Exam Performance, Question Analysis, Course Performance)
   */
  async getInstructorReports(user, filters = {}) {
    return await reportService.generateReport(user, filters);
  }

  /**
   * Get Exam Attempt by ID
   */
  async getExamAttemptById(attemptId, user) {
    const attempt = await ExamAttempt.findById(attemptId)
      .populate('examId', 'title duration totalMarks passingMarks')
      .populate('questionIds');
    if (!attempt) {
      const error = new Error('Attempt not found.');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === ROLES.STUDENT) {
      if (attempt.studentId.toString() !== user._id.toString()) {
        const error = new Error('Access denied.');
        error.statusCode = 403;
        throw error;
      }
      const attemptObj = attempt.toJSON();
      if (attemptObj.status !== 'PUBLISHED') {
        delete attemptObj.totalScore;
        delete attemptObj.percentage;
        delete attemptObj.passed;
        delete attemptObj.aiAnalysis;
        // Don't expose correct/incorrect info on answers
        attemptObj.answers = attemptObj.answers?.map(a => {
          const { isCorrect, marksObtained, ...rest } = a;
          return rest;
        });
      }
      return attemptObj;
    } else if (user.role === ROLES.INSTRUCTOR) {
      const course = await Course.findById(attempt.courseId);
      const isAssigned = course && course.instructorIds.some(id => id.toString() === user._id.toString());
      if (!isAssigned) {
        const error = new Error('Access denied. You are not assigned to this course.');
        error.statusCode = 403;
        throw error;
      }
      return attempt;
    } else {
      const error = new Error('Access denied.');
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Publish Result (Instructor)
   */
  async publishResult(attemptId, user) {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      const error = new Error('Attempt not found.');
      error.statusCode = 404;
      throw error;
    }
    const course = await Course.findById(attempt.courseId);
    const isAssigned = course && course.instructorIds.some(id => id.toString() === user._id.toString());
    if (!isAssigned) {
      const error = new Error('Access denied.');
      error.statusCode = 403;
      throw error;
    }
    
    if (attempt.status !== 'GRADED' && attempt.status !== 'SUBMITTED') {
      const error = new Error('Attempt must be graded before publishing.');
      error.statusCode = 400;
      throw error;
    }

    attempt.status = 'PUBLISHED';
    attempt.resultPublishedAt = new Date();
    attempt.resultPublishedBy = user._id;
    await attempt.save();

    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        studentId: attempt.studentId,
        type: 'RESULT_PUBLISHED',
        title: 'Exam Result Published',
        message: `Your instructor has published the result for your exam attempt.`,
        relatedId: attempt.examId
      });
    } catch (e) { console.error('Notification creation failed', e); }

    await auditService.logAudit({
      user,
      action: 'RESULT_PUBLISHED',
      resourceType: 'EXAM_ATTEMPT',
      resourceId: attempt._id,
      institutionId: attempt.institutionId,
      metadata: { studentId: attempt.studentId, examId: attempt.examId },
    });

    return attempt;
  }

  /**
   * Record Integrity Signal with anti-spam and rate limiting
   */
  async recordIntegritySignal(attemptId, signalType, metadata = {}, user) {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) return null;
    
    if (attempt.studentId.toString() !== user._id.toString()) return null;
    if (attempt.status !== 'IN_PROGRESS') return null;

    // Rate limiting & anti-spam: max 100 signals per attempt
    if (attempt.integritySignals && attempt.integritySignals.length >= 100) {
      return attempt;
    }

    // Deduplication check: disallow exact same signalType within 3 seconds
    const now = new Date();
    if (attempt.integritySignals && attempt.integritySignals.length > 0) {
      const lastSig = attempt.integritySignals[attempt.integritySignals.length - 1];
      if (lastSig.signalType === signalType && (now - new Date(lastSig.timestamp)) < 3000) {
        return attempt;
      }
    }

    let severity = 'MEDIUM';
    if (['MULTIPLE_PERSON_DETECTED', 'COPY_ATTEMPT', 'PASTE_ATTEMPT'].includes(signalType)) {
      severity = 'HIGH';
    } else if (['UNUSUAL_ANSWER_TIMING', 'WINDOW_BLUR', 'CONTEXT_MENU', 'CONNECTION_LOST'].includes(signalType)) {
      severity = 'LOW';
    }

    attempt.integritySignals.push({
      signalType,
      timestamp: now,
      severity,
      source: 'CLIENT',
      metadata,
    });

    // Recalculate integrity summary & risk level
    const aggregation = integrityService.aggregateSignals(attempt.integritySignals, attempt.questionTimings);
    if (!attempt.integritySummary) {
      attempt.integritySummary = {};
    }
    attempt.integritySummary.totalSignals = aggregation.totalSignals;
    attempt.integritySummary.riskLevel = aggregation.riskLevel;
    attempt.integritySummary.signalCounts = aggregation.signalCounts;

    await attempt.save();

    // Broadcast real-time Socket.IO alert to connected instructor monitoring rooms
    try {
      const { broadcastMonitoringEvent } = require('../sockets/socket.server');
      broadcastMonitoringEvent(attempt.examId.toString(), 'integrity_signal', {
        examId: attempt.examId,
        attemptId: attempt._id,
        studentId: attempt.studentId,
        signalType,
        severity,
        riskLevel: aggregation.riskLevel,
        riskScore: aggregation.totalScore,
        totalSignals: aggregation.totalSignals,
        timestamp: now,
        metadata,
      });
    } catch (socketErr) {
      console.warn('[SOCKET_BROADCAST_WARN]', socketErr.message);
    }

    return attempt;
  }

  /**
   * Update Integrity Review Status (Instructor)
   */
  async updateReviewStatus(attemptId, { reviewStatus, instructorNote }, user) {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      const error = new Error('Attempt not found.');
      error.statusCode = 404;
      throw error;
    }
    const course = await Course.findById(attempt.courseId);
    const isAssigned = course && course.instructorIds.some(id => id.toString() === user._id.toString());
    if (!isAssigned) {
      const error = new Error('Access denied.');
      error.statusCode = 403;
      throw error;
    }

    if (!attempt.integritySummary || !attempt.integritySummary.riskLevel) {
      const exam = await Exam.findById(attempt.examId);
      const summaryResult = await integrityService.generateAIIntegritySummary(
        exam ? exam.title : 'Exam',
        attempt.integritySignals || [],
        attempt.questionTimings || []
      );
      attempt.integritySummary = {
        totalSignals: summaryResult.totalSignals,
        riskLevel: summaryResult.riskLevel,
        signalCounts: summaryResult.signalCounts,
        aiSummary: summaryResult.aiSummary,
        aiRecommendation: summaryResult.aiRecommendation,
        reviewStatus: 'PENDING',
      };
    }

    if (reviewStatus) attempt.integritySummary.reviewStatus = reviewStatus;
    if (instructorNote !== undefined) attempt.integritySummary.instructorNote = instructorNote;
    attempt.integritySummary.reviewedAt = new Date();
    attempt.integritySummary.reviewedBy = user._id;

    await attempt.save();

    await auditService.logAudit({
      actor: user,
      action: 'INTEGRITY_REVIEW_UPDATED',
      resourceType: 'ExamAttempt',
      resourceId: attempt._id,
      resourceName: `Attempt ${attempt._id}`,
      courseId: attempt.courseId,
      institutionId: attempt.institutionId,
      status: 'SUCCESS',
      metadata: { reviewStatus: attempt.integritySummary.reviewStatus, instructorNote },
    });

    return attempt;
  }

  /**
   * Get real Instructor Proctoring & Integrity Dashboard data
   */
  async getInstructorProctoringDashboard(user, filters = {}) {
    if (user.role !== ROLES.INSTRUCTOR) {
      const error = new Error('Access denied. Only instructors can access the proctoring dashboard.');
      error.statusCode = 403;
      throw error;
    }

    const assignedCourses = await Course.find({ instructorIds: user._id }).select('_id name code');
    const courseIds = assignedCourses.map((c) => c._id);

    const examQuery = { courseId: { $in: courseIds } };
    if (filters.examId) examQuery._id = filters.examId;

    const exams = await Exam.find(examQuery).select('_id title courseId status duration totalMarks').populate('courseId', 'name code').lean();
    const examIds = exams.map((e) => e._id);

    const attemptQuery = { examId: { $in: examIds } };

    const attemptsRaw = await ExamAttempt.find(attemptQuery)
      .populate('studentId', 'name email rollNumber')
      .populate('examId', 'title courseId duration')
      .populate('courseId', 'name code')
      .sort({ updatedAt: -1 })
      .lean();

    const SimilarityReport = require('../models/SimilarityReport');
    const similarityReports = await SimilarityReport.find({ examId: { $in: examIds } }).lean();

    const mappedAttempts = attemptsRaw.map((att) => {
      const signals = att.integritySignals || [];
      const timings = att.questionTimings || [];
      const aggregation = integrityService.aggregateSignals(signals, timings);

      const reviewStatus = att.integritySummary?.reviewStatus || 'UNREVIEWED';
      const riskLevel = att.integritySummary?.riskLevel || aggregation.riskLevel;

      const attReports = similarityReports.filter(
        (r) => r.attemptId.toString() === att._id.toString() || r.comparedAttemptId.toString() === att._id.toString()
      );

      return {
        attemptId: att._id,
        examId: att.examId?._id || att.examId,
        examTitle: att.examId?.title || 'Exam',
        courseId: att.courseId?._id || att.courseId,
        courseCode: att.courseId?.code || '',
        courseName: att.courseId?.name || '',
        student: att.studentId
          ? {
              id: att.studentId._id,
              name: att.studentId.name,
              email: att.studentId.email,
              rollNumber: att.studentId.rollNumber || '',
            }
          : { name: 'Student' },
        status: att.status,
        score: att.totalScore || 0,
        percentage: att.percentage || 0,
        submittedAt: att.submittedAt,
        startedAt: att.startedAt,
        totalSignals: aggregation.totalSignals,
        riskLevel,
        signalCounts: aggregation.signalCounts,
        integritySignals: signals,
        questionTimings: timings,
        integritySummary: {
          totalSignals: aggregation.totalSignals,
          riskLevel,
          signalCounts: aggregation.signalCounts,
          aiSummary: att.integritySummary?.aiSummary || integrityService.buildDeterministicSummary(aggregation),
          aiRecommendation: att.integritySummary?.aiRecommendation || 'Instructor review recommended.',
          reviewStatus,
          instructorNote: att.integritySummary?.instructorNote || '',
          reviewedAt: att.integritySummary?.reviewedAt || null,
        },
        similarityReports: attReports,
      };
    });

    let filtered = mappedAttempts;
    if (filters.riskLevel) {
      filtered = filtered.filter((a) => a.riskLevel === filters.riskLevel.toUpperCase());
    }
    if (filters.reviewStatus) {
      filtered = filtered.filter((a) => a.integritySummary.reviewStatus === filters.reviewStatus.toUpperCase());
    }
    if (filters.signalType) {
      filtered = filtered.filter((a) => Boolean(a.signalCounts[filters.signalType]));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((a) => a.student.name.toLowerCase().includes(q) || a.examTitle.toLowerCase().includes(q));
    }

    const highRiskCount = mappedAttempts.filter((a) => a.riskLevel === 'HIGH').length;
    const mediumRiskCount = mappedAttempts.filter((a) => a.riskLevel === 'MEDIUM').length;
    const unreviewedCount = mappedAttempts.filter(
      (a) => a.integritySummary.reviewStatus === 'UNREVIEWED' || a.integritySummary.reviewStatus === 'PENDING'
    ).length;

    return {
      stats: {
        totalAssignedExams: exams.length,
        totalAttempts: mappedAttempts.length,
        highRiskAttemptsCount: highRiskCount,
        mediumRiskAttemptsCount: mediumRiskCount,
        unreviewedCount,
      },
      exams: exams.map((e) => ({ id: e._id, title: e.title, courseCode: e.courseId?.code })),
      attempts: filtered,
    };
  }

  /**
   * Get single attempt integrity details with similarity reports
   */
  async getAttemptIntegrityDetails(attemptId, user) {
    const attempt = await ExamAttempt.findById(attemptId)
      .populate('studentId', 'name email rollNumber')
      .populate('examId', 'title courseId duration')
      .populate('courseId', 'name code instructorIds')
      .populate('answers.questionId', 'questionText options difficulty type')
      .lean();

    if (!attempt) {
      const error = new Error('Attempt not found.');
      error.statusCode = 404;
      throw error;
    }

    const course = attempt.courseId;
    if (!course || !course.instructorIds.some((id) => id.toString() === user._id.toString())) {
      const error = new Error('Access denied.');
      error.statusCode = 403;
      throw error;
    }

    const SimilarityReport = require('../models/SimilarityReport');
    const similarityReports = await SimilarityReport.find({
      $or: [{ attemptId: attempt._id }, { comparedAttemptId: attempt._id }],
    })
      .populate('studentId', 'name email')
      .populate('comparedStudentId', 'name email')
      .populate('questionId', 'questionText')
      .lean();

    const aggregation = integrityService.aggregateSignals(attempt.integritySignals || [], attempt.questionTimings || []);

    return {
      attempt,
      aggregation,
      similarityReports,
    };
  }

  /**
   * Run Similarity Check for Exam
   */
  async runExamSimilarityCheck(examId, user) {
    const result = await integrityService.runExamSimilarityCheck(examId, user);
    await auditService.logAudit({
      actor: user,
      action: 'SIMILARITY_CHECK_RUN',
      resourceType: 'Exam',
      resourceId: examId,
      status: 'SUCCESS',
      metadata: { reportsCount: result.reportsCount },
    });
    return result;
  }
}

module.exports = new ExamService();
