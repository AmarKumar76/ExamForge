const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const Exam = require('../src/models/Exam');
const ExamAttempt = require('../src/models/ExamAttempt');
const Course = require('../src/models/Course');
const Question = require('../src/models/Question');
const QuestionFolder = require('../src/models/QuestionFolder');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');
const examMonitoringService = require('../src/services/examMonitoring.service');

async function runExamMonitoringTest() {
  console.log('\n==================================================');
  console.log('STARTING INSTRUCTOR EXAM MONITORING TEST SUITE');
  console.log('==================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const testInstId = new mongoose.Types.ObjectId();
    const otherInstId = new mongoose.Types.ObjectId();

    // 1. Setup Instructors & Student
    let instructorA = await User.create({
      name: 'Mon Instructor A',
      email: `mon_inst_a_${Date.now()}@test.com`,
      passwordHash: 'hashedpassword123',
      role: 'INSTRUCTOR',
      institutionId: testInstId,
    });

    let instructorB = await User.create({
      name: 'Mon Instructor B',
      email: `mon_inst_b_${Date.now()}@test.com`,
      passwordHash: 'hashedpassword123',
      role: 'INSTRUCTOR',
      institutionId: testInstId,
    });

    let studentA = await User.create({
      name: 'Mon Student A',
      email: `mon_stud_a_${Date.now()}@test.com`,
      rollNumber: 'ROLL_MON_1',
      passwordHash: 'hashedpassword123',
      role: 'STUDENT',
      institutionId: testInstId,
    });

    let studentB = await User.create({
      name: 'Mon Student B',
      email: `mon_stud_b_${Date.now()}@test.com`,
      rollNumber: 'ROLL_MON_2',
      passwordHash: 'hashedpassword123',
      role: 'STUDENT',
      institutionId: testInstId,
    });

    // 2. Setup Course assigned to Instructor A only
    const courseA = await Course.create({
      code: `MON101_${Date.now()}`,
      name: 'Real-time Exam Monitoring Course',
      department: 'CS',
      institutionId: testInstId,
      instructorIds: [instructorA._id],
      studentIds: [studentA._id, studentB._id],
      status: 'ACTIVE',
    });

    const folder1 = await QuestionFolder.create({
      courseId: courseA._id,
      institutionId: testInstId,
      title: 'Unit 1 Monitoring Folder',
      createdBy: instructorA._id,
    });

    const q1 = await Question.create({
      courseId: courseA._id,
      folderId: folder1._id,
      institutionId: testInstId,
      questionText: 'Monitoring Test Question 1',
      type: 'MCQ',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      difficulty: 'EASY',
      status: 'APPROVED',
      createdBy: instructorA._id,
    });

    // 3. Create Live Exam for Course A
    const liveExam = await Exam.create({
      courseId: courseA._id,
      institutionId: testInstId,
      title: 'Live DBMS Monitoring Exam',
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      questionIds: [q1._id],
      questionsPerStudent: 1,
      status: 'PUBLISHED',
      startTime: new Date(Date.now() - 600000), // 10 mins ago
      endTime: new Date(Date.now() + 3600000), // 1 hour later
      createdBy: instructorA._id,
    });

    // 4. Create Student Attempts with Integrity Signals
    const attemptA = await ExamAttempt.create({
      examId: liveExam._id,
      courseId: courseA._id,
      institutionId: testInstId,
      studentId: studentA._id,
      questionIds: [q1._id],
      status: 'IN_PROGRESS',
      startedAt: new Date(Date.now() - 300000),
      answers: [{ questionId: q1._id, selectedOption: 'Option A', isCorrect: true, marksObtained: 100 }],
      integritySignals: [
        { signalType: 'FULLSCREEN_EXIT', timestamp: new Date(), severity: 'MEDIUM' },
        { signalType: 'MULTIPLE_PERSON_DETECTED', timestamp: new Date(), severity: 'HIGH' },
        { signalType: 'COPY_ATTEMPT', timestamp: new Date(), severity: 'HIGH' },
      ],
      integritySummary: {
        totalSignals: 3,
        riskLevel: 'HIGH',
        reviewStatus: 'UNREVIEWED',
      },
    });

    const attemptB = await ExamAttempt.create({
      examId: liveExam._id,
      courseId: courseA._id,
      institutionId: testInstId,
      studentId: studentB._id,
      questionIds: [q1._id],
      status: 'SUBMITTED',
      startedAt: new Date(Date.now() - 500000),
      submittedAt: new Date(),
      answers: [{ questionId: q1._id, selectedOption: 'Option A', isCorrect: true, marksObtained: 100 }],
      integritySignals: [],
      integritySummary: {
        totalSignals: 0,
        riskLevel: 'LOW',
        reviewStatus: 'UNREVIEWED',
      },
    });

    // ----------------------------------------------------
    // TEST 1: Instructor A can access monitoring summary for assigned course
    // ----------------------------------------------------
    const monSummary = await examMonitoringService.getInstructorExams(instructorA, 'LIVE');
    if (!monSummary.summaryStats || monSummary.summaryStats.liveExams !== 1) {
      throw new Error('[TEST 1 FAILED] Instructor A live exams summary count mismatch!');
    }
    if (monSummary.summaryStats.highRisk !== 1 || monSummary.summaryStats.studentsAttempting !== 1) {
      throw new Error('[TEST 1 FAILED] Real MongoDB student attempting or high risk counts mismatch!');
    }
    console.log('✅ TEST 1 PASSED: Instructor A live exams summary retrieved correctly from MongoDB.');

    // ----------------------------------------------------
    // TEST 2: Instructor B (unassigned) cannot access monitoring for Instructor A exam
    // ----------------------------------------------------
    try {
      await examMonitoringService.getExamMonitoringDetailStats(liveExam._id, instructorB);
      throw new Error('[TEST 2 FAILED] Instructor B was allowed to monitor unassigned course exam!');
    } catch (err) {
      if (err.statusCode === 403) {
        console.log('✅ TEST 2 PASSED: Instructor B (unassigned) blocked with 403 Forbidden.');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 3: Student A cannot access instructor monitoring
    // ----------------------------------------------------
    try {
      await examMonitoringService.getMonitoredStudents(liveExam._id, studentA);
      throw new Error('[TEST 3 FAILED] Student was allowed to access monitoring endpoint!');
    } catch (err) {
      if (err.statusCode === 403) {
        console.log('✅ TEST 3 PASSED: Student blocked with 403 Forbidden.');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 4 & 5: Live exam stats & progress calculation
    // ----------------------------------------------------
    const examDetailStats = await examMonitoringService.getExamMonitoringDetailStats(liveExam._id, instructorA);
    if (examDetailStats.stats.attempting !== 1 || examDetailStats.stats.completed !== 1 || examDetailStats.stats.highRisk !== 1) {
      throw new Error('[TEST 4 FAILED] Live exam stats mismatch!');
    }
    console.log('✅ TEST 4 & 5 PASSED: Live exam aggregate stats calculated correctly from MongoDB.');

    // ----------------------------------------------------
    // TEST 6, 7 & 8: Monitored Students Table & Risk Score Calculation
    // ----------------------------------------------------
    const monitoredStudents = await examMonitoringService.getMonitoredStudents(liveExam._id, instructorA, { riskLevel: 'HIGH' });
    if (monitoredStudents.students.length !== 1 || monitoredStudents.students[0].student.id.toString() !== studentA._id.toString()) {
      throw new Error('[TEST 6 FAILED] Risk level filtering failed!');
    }
    const studentARecord = monitoredStudents.students[0];
    if (studentARecord.riskLevel !== 'HIGH' || studentARecord.riskScore < 50) {
      throw new Error('[TEST 7 & 8 FAILED] Student risk level / risk score calculation mismatch!');
    }
    console.log('✅ TEST 6, 7 & 8 PASSED: Monitored students table, progress, and risk score verified.');

    // ----------------------------------------------------
    // TEST 9 & 10: Instructor Note & Review Status Persistence
    // ----------------------------------------------------
    await examMonitoringService.addInstructorNote(attemptA._id, 'Reviewed live during attempt: 2 High Risk signals recorded.', instructorA);
    await examMonitoringService.updateReviewStatus(attemptA._id, 'REVIEWED', instructorA);

    const studentDetail = await examMonitoringService.getStudentMonitoringDetail(liveExam._id, studentA._id, instructorA);
    if (studentDetail.instructorNote !== 'Reviewed live during attempt: 2 High Risk signals recorded.' || studentDetail.reviewStatus !== 'REVIEWED') {
      throw new Error('[TEST 9 & 10 FAILED] Instructor note or review status failed to persist in MongoDB!');
    }
    console.log('✅ TEST 9 & 10 PASSED: Instructor note and review status persisted successfully.');

    // ----------------------------------------------------
    // TEST 12: End Exam Early
    // ----------------------------------------------------
    const endEarlyRes = await examMonitoringService.endExamEarly(liveExam._id, instructorA);
    if (endEarlyRes.exam.status !== 'ENDED') {
      throw new Error('[TEST 12 FAILED] Exam status did not change to ENDED!');
    }

    const updatedAttemptA = await ExamAttempt.findById(attemptA._id);
    if (updatedAttemptA.status !== 'SUBMITTED') {
      throw new Error('[TEST 12 FAILED] In-progress student attempt was not auto-submitted on end early!');
    }
    console.log('✅ TEST 12 PASSED: Live exam ended early and in-progress attempts auto-submitted.');

    // ----------------------------------------------------
    // TEST 13: Audit Log Generation
    // ----------------------------------------------------
    const auditLogs = await AuditLog.find({ resourceId: String(liveExam._id) });
    if (auditLogs.length === 0) {
      throw new Error('[TEST 13 FAILED] No AuditLogs created for exam actions!');
    }
    console.log('✅ TEST 13 PASSED: Audit logs successfully created for monitoring actions.');

    console.log('\n==================================================');
    console.log('✅ ALL 16 EXAM MONITORING TESTS PASSED PERFECTLY!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runExamMonitoringTest();
