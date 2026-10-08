require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Course = require('../../src/models/Course');
const Exam = require('../../src/models/Exam');
const ExamAttempt = require('../../src/models/ExamAttempt');
const Question = require('../../src/models/Question');
const Institution = require('../../src/models/Institution');
const AuditLog = require('../../src/models/AuditLog');
const { ROLES } = require('../../src/constants/roles');
const { generateAccessToken } = require('../../src/utils/jwt');
const config = require('../../src/config/env');

describe('ExamForge Reports Module Tests', () => {
  jest.setTimeout(30000);

  let instUser, otherInstUser, studentUser, adminUser;
  let instToken, otherInstToken, studentToken, adminToken;
  let institution, course1, course2, exam1, question1, attempt1;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://127.0.0.1:27017/examforge');
    }

    // Clean test collections
    await User.deleteMany({ email: { $regex: /@reporttest\.com$/ } });
    await Course.deleteMany({ code: { $regex: /^RPT/ } });
    await Exam.deleteMany({ title: { $regex: /^Report Test/ } });
    await ExamAttempt.deleteMany({});
    await Question.deleteMany({ topic: 'ReportTest' });
    await Institution.deleteMany({ code: 'RPTINST' });
    await AuditLog.deleteMany({ action: { $in: ['REPORT_GENERATED', 'REPORT_EXPORTED'] } });

    // 1. Create Institution
    institution = await Institution.create({
      name: 'Report Test University',
      code: 'RPTINST',
    });

    // 2. Create Users
    instUser = await User.create({
      name: 'Instructor One',
      email: 'inst1@reporttest.com',
      passwordHash: 'hash',
      role: ROLES.INSTRUCTOR,
      institutionId: institution._id,
    });

    otherInstUser = await User.create({
      name: 'Instructor Two',
      email: 'inst2@reporttest.com',
      passwordHash: 'hash',
      role: ROLES.INSTRUCTOR,
      institutionId: institution._id,
    });

    studentUser = await User.create({
      name: 'Student One',
      email: 'student1@reporttest.com',
      passwordHash: 'hash',
      role: ROLES.STUDENT,
      institutionId: institution._id,
      rollNumber: 'RPT001',
    });

    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@reporttest.com',
      passwordHash: 'hash',
      role: ROLES.SUPER_ADMIN,
    });

    // 3. Tokens
    instToken = generateAccessToken({ id: instUser._id, _id: instUser._id, role: instUser.role });
    otherInstToken = generateAccessToken({ id: otherInstUser._id, _id: otherInstUser._id, role: otherInstUser.role });
    studentToken = generateAccessToken({ id: studentUser._id, _id: studentUser._id, role: studentUser.role });
    adminToken = generateAccessToken({ id: adminUser._id, _id: adminUser._id, role: adminUser.role });

    // 4. Create Courses
    course1 = await Course.create({
      code: 'RPT101',
      name: 'Reporting Fundamentals',
      department: 'CS',
      institutionId: institution._id,
      instructorIds: [instUser._id],
      studentIds: [studentUser._id],
    });

    course2 = await Course.create({
      code: 'RPT102',
      name: 'Advanced Reporting',
      department: 'CS',
      institutionId: institution._id,
      instructorIds: [otherInstUser._id],
      studentIds: [studentUser._id],
    });

    // 5. Create Question
    question1 = await Question.create({
      courseId: course1._id,
      institutionId: institution._id,
      createdBy: instUser._id,
      questionText: 'What is 2 + 2?',
      type: 'MCQ',
      difficulty: 'EASY',
      points: 10,
      topic: 'ReportTest',
      options: ['3', '4'],
      correctAnswer: '4',
      status: 'APPROVED',
    });

    // 6. Create Exam
    exam1 = await Exam.create({
      title: 'Report Test Exam 1',
      courseId: course1._id,
      institutionId: institution._id,
      createdBy: instUser._id,
      durationMinutes: 60,
      totalMarks: 100,
      passingPercentage: 50,
      scheduledDate: new Date(),
      questionIds: [question1._id],
      status: 'PUBLISHED',
    });

    // 7. Create Exam Attempt
    attempt1 = await ExamAttempt.create({
      examId: exam1._id,
      courseId: course1._id,
      institutionId: institution._id,
      studentId: studentUser._id,
      questionIds: [question1._id],
      status: 'PUBLISHED',
      totalScore: 80,
      percentage: 80,
      passed: true,
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
      answers: [
        {
          questionId: question1._id,
          selectedOption: '4',
          isCorrect: true,
          marksObtained: 10,
        },
      ],
      integritySignals: [
        {
          signalType: 'TAB_SWITCH',
          timestamp: new Date(),
          severity: 'MEDIUM',
        },
      ],
      integritySummary: {
        totalSignals: 1,
        riskLevel: 'LOW',
        reviewStatus: 'REVIEWED',
        instructorNote: 'Checked and verified.',
      },
    });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@reporttest\.com$/ } });
    await Course.deleteMany({ code: { $regex: /^RPT/ } });
    await Exam.deleteMany({ title: { $regex: /^Report Test/ } });
    await ExamAttempt.deleteMany({});
    await Question.deleteMany({ topic: 'ReportTest' });
    await Institution.deleteMany({ code: 'RPTINST' });
    await AuditLog.deleteMany({ action: { $in: ['REPORT_GENERATED', 'REPORT_EXPORTED'] } });
    await mongoose.connection.close();
  }, 30000);

  test('1. Instructor can generate EXAM_RESULT report', async () => {
    const res = await request(app)
      .get(`/api/v1/reports?reportType=EXAM_RESULT&courseId=${course1._id}`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reportType).toBe('EXAM_RESULT');
    expect(res.body.data.rows.length).toBe(1);
    expect(res.body.data.rows[0].studentName).toBe('Student One');
    expect(res.body.data.rows[0].percentage).toBe('80%');
  });

  test('2. Instructor cannot generate another instructor course report (cross-course blocked)', async () => {
    const res = await request(app)
      .get(`/api/v1/reports?reportType=EXAM_RESULT&courseId=${course2._id}`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(403);
  });

  test('3. Student is blocked from accessing reports (RBAC enforced)', async () => {
    const res = await request(app)
      .get('/api/v1/reports?reportType=EXAM_RESULT')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  test('4. Super Admin can access any course report', async () => {
    const res = await request(app)
      .get(`/api/v1/reports?reportType=EXAM_RESULT&courseId=${course1._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rows.length).toBe(1);
  });

  test('5. STUDENT_PERFORMANCE report returns detailed metrics', async () => {
    const res = await request(app)
      .get(`/api/v1/reports?reportType=STUDENT_PERFORMANCE&courseId=${course1._id}`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reportType).toBe('STUDENT_PERFORMANCE');
    expect(res.body.data.rows[0].studentName).toBe('Student One');
    expect(res.body.data.rows[0].correct).toBe(1);
  });

  test('6. QUESTION_ANALYSIS report aggregates question performance', async () => {
    const res = await request(app)
      .get(`/api/v1/reports?reportType=QUESTION_ANALYSIS&courseId=${course1._id}`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reportType).toBe('QUESTION_ANALYSIS');
    expect(res.body.data.rows.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.rows[0].attempted).toBe(1);
    expect(res.body.data.rows[0].correctPct).toBe('100%');
  });

  test('7. COURSE_PERFORMANCE report aggregates course stats', async () => {
    const res = await request(app)
      .get(`/api/v1/reports?reportType=COURSE_PERFORMANCE&courseId=${course1._id}`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reportType).toBe('COURSE_PERFORMANCE');
    expect(res.body.data.rows[0].course).toContain('RPT101');
    expect(res.body.data.rows[0].averageScore).toBe('80%');
  });

  test('8. ACADEMIC_INTEGRITY report displays risk levels & signals', async () => {
    const res = await request(app)
      .get(`/api/v1/reports?reportType=ACADEMIC_INTEGRITY&courseId=${course1._id}`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reportType).toBe('ACADEMIC_INTEGRITY');
    expect(res.body.data.rows[0].riskLevel).toBe('Low Risk');
    expect(res.body.data.rows[0].totalSignals).toBe(1);
  });

  test('9. CSV export returns text/csv content', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/export?reportType=EXAM_RESULT&courseId=${course1._id}&format=csv`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Student Name');
    expect(res.text).toContain('Student One');
  });

  test('10. XLSX export returns spreadsheet XML content', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/export?reportType=EXAM_RESULT&courseId=${course1._id}&format=xlsx`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.ms-excel');
    expect(res.text).toContain('Workbook');
    expect(res.text).toContain('Student One');
  });

  test('11. PDF export returns formatted printable HTML document', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/export?reportType=EXAM_RESULT&courseId=${course1._id}&format=pdf`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('ExamForge Report');
    expect(res.text).toContain('Student One');
  });

  test('12. Audit log entry created on report generation & export', async () => {
    const logs = await AuditLog.find({ action: { $in: ['REPORT_GENERATED', 'REPORT_EXPORTED'] } });
    expect(logs.length).toBeGreaterThan(0);
  });

  test('13. Dedicated route GET /api/v1/reports/exam/:examId works', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/exam/${exam1._id}`)
      .set('Authorization', `Bearer ${instToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reportType).toBe('EXAM_RESULT');
    expect(res.body.data.rows.length).toBe(1);
  });
});
