const mongoose = require('mongoose');
const config = require('../src/config/env');
const MONGO_URI = config.mongoUri;

const Exam = require('../src/models/Exam');
const ExamAttempt = require('../src/models/ExamAttempt');
const Course = require('../src/models/Course');
const Question = require('../src/models/Question');
const QuestionFolder = require('../src/models/QuestionFolder');
const User = require('../src/models/User');
const examService = require('../src/services/exam.service');

async function runScheduledExamEditLockTest() {
  console.log('\n==================================================');
  console.log('STARTING SCHEDULED EXAM EDIT LOCK RULE TEST SUITE');
  console.log('==================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Setup Test User (Instructor & Student) and Course
    const testInstId = new mongoose.Types.ObjectId();

    let instructor = await User.findOne({ role: 'INSTRUCTOR' });
    if (!instructor) {
      instructor = await User.create({
        name: 'Test Instructor Lock',
        email: `lock_inst_${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'INSTRUCTOR',
        institutionId: testInstId,
      });
    }

    let student = await User.findOne({ role: 'STUDENT' });
    if (!student) {
      student = await User.create({
        name: 'Test Student Lock',
        email: `lock_stud_${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'STUDENT',
        institutionId: testInstId,
      });
    }

    const course = await Course.create({
      code: `LOCK101_${Date.now()}`,
      name: 'Scheduled Exam Lock Test Course',
      department: 'CS',
      institutionId: instructor.institutionId || testInstId,
      instructorIds: [instructor._id],
      studentIds: [student._id],
      status: 'ACTIVE',
    });

    const folder1 = await QuestionFolder.create({
      courseId: course._id,
      institutionId: course.institutionId,
      title: 'Unit 1 Lock Folder',
      createdBy: instructor._id,
    });

    const q1 = await Question.create({
      courseId: course._id,
      folderId: folder1._id,
      institutionId: course.institutionId,
      questionText: 'Lock Test Question 1 Easy',
      type: 'MCQ',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      difficulty: 'EASY',
      status: 'APPROVED',
      createdBy: instructor._id,
    });

    const q2 = await Question.create({
      courseId: course._id,
      folderId: folder1._id,
      institutionId: course.institutionId,
      questionText: 'Lock Test Question 2 Medium',
      type: 'MCQ',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      difficulty: 'MEDIUM',
      status: 'APPROVED',
      createdBy: instructor._id,
    });

    // ----------------------------------------------------
    // TEST 1: Create DRAFT exam. Verify Edit works.
    // ----------------------------------------------------
    const draftExam = await examService.createExam(
      {
        courseId: course._id,
        title: 'Draft Lock Test Exam',
        description: 'Testing Draft state editing',
        duration: 45,
        totalMarks: 50,
        passingMarks: 20,
        folderIds: [folder1._id.toString()],
        questionIds: [q1._id.toString(), q2._id.toString()],
        questionsPerStudent: 2,
        difficultyDistribution: { easy: 1, medium: 1, hard: 0 },
      },
      instructor
    );

    console.log('\n[TEST 1] Draft Exam created:', draftExam.title, 'Status:', draftExam.status);
    let lockCheck = await examService.checkExamEditLock(draftExam);
    if (lockCheck.isLocked || !lockCheck.canEdit) {
      throw new Error('[TEST 1 FAILED] Draft exam should be editable!');
    }
    console.log('✅ TEST 1 PASSED: DRAFT exam is fully editable.');

    // ----------------------------------------------------
    // TEST 2: Publish exam. Set future start time. No attempts exist. Verify Edit works.
    // ----------------------------------------------------
    const futureStart = new Date(Date.now() + 3600 * 1000); // 1 hour in future
    const futureEnd = new Date(Date.now() + 7200 * 1000); // 2 hours in future

    let scheduledExam = await examService.updateExam(
      draftExam._id,
      {
        startTime: futureStart,
        endTime: futureEnd,
      },
      instructor
    );

    scheduledExam = await examService.publishExam(scheduledExam._id, instructor);
    console.log('\n[TEST 2] Exam published. Status:', scheduledExam.status);

    lockCheck = await examService.checkExamEditLock(scheduledExam);
    if (scheduledExam.status !== 'SCHEDULED' || lockCheck.isLocked || !lockCheck.canEdit) {
      throw new Error('[TEST 2 FAILED] SCHEDULED exam before start time with 0 attempts should be editable!');
    }
    console.log('✅ TEST 2 PASSED: SCHEDULED exam before start time with 0 attempts is editable.');

    // ----------------------------------------------------
    // TEST 3: Edit title/time/questions. Save. Verify changes persist.
    // ----------------------------------------------------
    const updatedExam = await examService.updateExam(
      scheduledExam._id,
      {
        title: 'Updated Scheduled Title',
        duration: 90,
      },
      instructor
    );

    if (updatedExam.title !== 'Updated Scheduled Title' || updatedExam.duration !== 90) {
      throw new Error('[TEST 3 FAILED] Updated fields did not persist!');
    }
    console.log('✅ TEST 3 PASSED: Scheduled exam updated successfully before any attempt.');

    // ----------------------------------------------------
    // TEST 4 & 5: Start an ExamAttempt for the exam. Verify Edit is disabled & returns HTTP 409.
    // ----------------------------------------------------
    // Update startTime to current/past so student can start attempt
    await Exam.findByIdAndUpdate(scheduledExam._id, { startTime: new Date(Date.now() - 60000) });

    const attemptResult = await examService.startExamAttempt(scheduledExam._id, student);
    console.log('\n[TEST 4] Student started an attempt. Attempt ID:', attemptResult.attempt._id);

    const reCheckedExam = await examService.getExamById(scheduledExam._id, instructor);
    if (!reCheckedExam.isLocked || reCheckedExam.canEdit) {
      throw new Error('[TEST 4 FAILED] Exam should be locked after student starts an attempt!');
    }
    console.log('✅ TEST 4 PASSED: Exam is locked (isLocked: true, canEdit: false) after first attempt.');

    // TEST 5: Call updateExam directly after attempt started -> Expect HTTP 409 Conflict Error
    let test5Failed = false;
    try {
      await examService.updateExam(scheduledExam._id, { title: 'Illegal Edit Title' }, instructor);
    } catch (err) {
      if (err.statusCode === 409 && err.code === 'EXAM_LOCKED') {
        test5Failed = true;
        console.log('✅ TEST 5 PASSED: Backend rejected update with HTTP 409 Conflict:', err.message);
      } else {
        throw new Error(`[TEST 5 FAILED] Expected statusCode 409, got: ${err.statusCode} - ${err.message}`);
      }
    }
    if (!test5Failed) {
      throw new Error('[TEST 5 FAILED] Backend allowed modification after attempt started!');
    }

    // ----------------------------------------------------
    // TEST 6, 7, 8: Try changing question folders, duration, start/end time after attempt started.
    // ----------------------------------------------------
    try {
      await examService.updateExam(scheduledExam._id, { folderIds: ['some_other_folder'] }, instructor);
      throw new Error('[TEST 6 FAILED] Changing question folders was not rejected!');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log('✅ TEST 6 PASSED: Changing question folders rejected with 409 Conflict.');
      } else {
        throw err;
      }
    }

    try {
      await examService.updateExam(scheduledExam._id, { duration: 120 }, instructor);
      throw new Error('[TEST 7 FAILED] Changing duration was not rejected!');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log('✅ TEST 7 PASSED: Changing duration rejected with 409 Conflict.');
      } else {
        throw err;
      }
    }

    try {
      await examService.updateExam(scheduledExam._id, { startTime: new Date() }, instructor);
      throw new Error('[TEST 8 FAILED] Changing start/end time was not rejected!');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log('✅ TEST 8 PASSED: Changing start/end time rejected with 409 Conflict.');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 9: Try editing after startTime has passed even with zero attempts. Verify rejected (409).
    // ----------------------------------------------------
    const pastExam = await Exam.create({
      courseId: course._id,
      institutionId: course.institutionId,
      title: 'Past Start Time Exam',
      duration: 30,
      totalMarks: 50,
      passingMarks: 20,
      questionIds: [q1._id],
      status: 'SCHEDULED',
      startTime: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      endTime: new Date(Date.now() + 3600 * 1000),
      createdBy: instructor._id,
    });

    try {
      await examService.updateExam(pastExam._id, { title: 'Edit Past Start Time' }, instructor);
      throw new Error('[TEST 9 FAILED] Editing exam with passed start time was not rejected!');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log('✅ TEST 9 PASSED: Editing exam after startTime passed rejected with 409 Conflict.');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 10: Cancel a scheduled exam before any attempt starts. Verify status becomes CANCELLED.
    // ----------------------------------------------------
    const schedNoAttempts = await Exam.create({
      courseId: course._id,
      institutionId: course.institutionId,
      title: 'Sched Exam To Cancel',
      duration: 30,
      totalMarks: 50,
      passingMarks: 20,
      questionIds: [q1._id],
      status: 'SCHEDULED',
      startTime: new Date(Date.now() + 3600 * 1000),
      endTime: new Date(Date.now() + 7200 * 1000),
      createdBy: instructor._id,
    });

    const cancelledExam = await examService.updateExam(schedNoAttempts._id, { status: 'CANCELLED' }, instructor);
    if (cancelledExam.status !== 'CANCELLED') {
      throw new Error('[TEST 10 FAILED] Status did not change to CANCELLED!');
    }
    console.log('✅ TEST 10 PASSED: Scheduled exam with 0 attempts successfully cancelled.');

    // ----------------------------------------------------
    // TEST 11: Verify existing student attempt questionIds remain unchanged after any later exam state changes.
    // ----------------------------------------------------
    const studentAttempt = await ExamAttempt.findById(attemptResult.attempt._id);
    const assignedQuestionIds = studentAttempt.questionIds.map((id) => id.toString());

    if (!assignedQuestionIds.includes(q1._id.toString()) && !assignedQuestionIds.includes(q2._id.toString())) {
      throw new Error('[TEST 11 FAILED] Student attempt questionIds were corrupted!');
    }
    console.log('✅ TEST 11 PASSED: Student attempt assigned questionIds remain unchanged (IDs:', assignedQuestionIds.join(', '), ').');

    console.log('\n==================================================');
    console.log('✅ ALL 11 SCHEDULED EXAM EDIT LOCK TESTS PASSED!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runScheduledExamEditLockTest();
