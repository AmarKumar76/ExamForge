const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Course = require('../models/Course');
const Question = require('../models/Question');
const CourseMaterial = require('../models/CourseMaterial');
const { ROLES } = require('../constants/roles');
const auditService = require('./audit.service');

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

    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;
    if (start && end && start >= end) {
      const error = new Error('Exam start time must be before end time.');
      error.statusCode = 400;
      error.code = 'INVALID_EXAM_SCHEDULE';
      throw error;
    }

    // Verify all selected questions are APPROVED and belong to this course
    let poolQuestions = [];
    if (!questionIds || questionIds.length === 0) {
      poolQuestions = await Question.find({
        courseId: course._id,
        institutionId: course.institutionId,
        status: 'APPROVED',
      });
      questionIds = poolQuestions.map((q) => q._id);
    } else {
      poolQuestions = await Question.find({
        _id: { $in: questionIds },
        courseId: course._id,
      });
    }

    if (poolQuestions.length === 0) {
      const error = new Error('No approved questions available for this course in the Question Bank.');
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

    // Check difficulty distribution against available pool first if provided
    if (difficultyDistribution) {
      const reqEasy = parseInt(difficultyDistribution.easy || 0, 10);
      const reqMed = parseInt(difficultyDistribution.medium || 0, 10);
      const reqHard = parseInt(difficultyDistribution.hard || 0, 10);

      const availEasy = poolQuestions.filter((q) => q.difficulty === 'EASY').length;
      const availMed = poolQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
      const availHard = poolQuestions.filter((q) => q.difficulty === 'HARD').length;

      if (reqEasy > availEasy) {
        const error = new Error(`Not enough approved Easy questions. Required: ${reqEasy}, Available: ${availEasy}.`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_EASY_QUESTIONS';
        throw error;
      }
      if (reqMed > availMed) {
        const error = new Error(`Not enough approved Medium questions. Required: ${reqMed}, Available: ${availMed}.`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_MEDIUM_QUESTIONS';
        throw error;
      }
      if (reqHard > availHard) {
        const error = new Error(`Not enough approved Hard questions. Required: ${reqHard}, Available: ${availHard}.`);
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

    const exam = await Exam.create({
      courseId: course._id,
      institutionId: course.institutionId,
      title: title.trim(),
      description: description ? description.trim() : '',
      duration: dur,
      totalMarks: totMarks,
      passingMarks: passMarks,
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

    const examsWithMetrics = exams.map((e) => {
      const eObj = e.toJSON();
      eObj.computedStatus = this.deriveExamStatus(e);

      const eAttempts = attempts.filter((a) => a.examId.toString() === e._id.toString());
      const submittedAttempts = eAttempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'GRADED');

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
    });

    return examsWithMetrics;
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

    const eObj = exam.toJSON();
    eObj.computedStatus = this.deriveExamStatus(exam);
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

    // Prevent modifying questions if exam has submitted attempts
    const submittedAttemptsCount = await ExamAttempt.countDocuments({ examId: exam._id, status: { $in: ['SUBMITTED', 'GRADED'] } });
    if (submittedAttemptsCount > 0 && updateData.questionIds) {
      const error = new Error('Cannot modify questions of an exam with existing student submissions.');
      error.statusCode = 400;
      error.code = 'EXAM_HAS_SUBMISSIONS';
      throw error;
    }

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
    if (updateData.questionsPerStudent !== undefined) exam.questionsPerStudent = parseInt(updateData.questionsPerStudent, 10) || 0;
    if (updateData.difficultyDistribution) exam.difficultyDistribution = updateData.difficultyDistribution;

    const newStart = updateData.startTime !== undefined ? (updateData.startTime ? new Date(updateData.startTime) : null) : exam.startTime;
    const newEnd = updateData.endTime !== undefined ? (updateData.endTime ? new Date(updateData.endTime) : null) : exam.endTime;

    if (newStart && newEnd && newStart >= newEnd) {
      const error = new Error('Exam start time must be before end time.');
      error.statusCode = 400;
      error.code = 'INVALID_EXAM_SCHEDULE';
      throw error;
    }

    exam.startTime = newStart;
    exam.endTime = newEnd;

    await exam.save();
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

    await auditService.logAudit({
      user,
      action: 'EXAM_PUBLISHED',
      resourceType: 'EXAM',
      resourceId: exam._id,
      institutionId: exam.institutionId,
      metadata: { examTitle: exam.title },
    });

    return exam.populate('questionIds');
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
            totalScore: myAttempt.totalScore,
            percentage: myAttempt.percentage,
            passed: myAttempt.passed,
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
        const error = new Error(`Exam has not started yet. Scheduled start time: ${new Date(exam.startTime).toLocaleString()}`);
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

    await attempt.save();

    await auditService.logAudit({
      user,
      action: 'EXAM_SUBMITTED',
      resourceType: 'EXAM_ATTEMPT',
      resourceId: attempt._id,
      institutionId: attempt.institutionId,
      metadata: { examTitle: exam.title, score: finalScore, percentage },
    });

    return attempt;
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

    const [materialsCount, questionsCount, approvedQuestionsCount, exams, attempts] = await Promise.all([
      CourseMaterial.countDocuments({ courseId: { $in: courseIds } }),
      Question.countDocuments({ courseId: { $in: courseIds } }),
      Question.countDocuments({ courseId: { $in: courseIds }, status: 'APPROVED' }),
      Exam.find({ courseId: { $in: courseIds } }).select('_id title status'),
      ExamAttempt.find({ courseId: { $in: courseIds }, status: { $in: ['SUBMITTED', 'GRADED'] } }),
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
}

module.exports = new ExamService();
