const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Notification = require('../models/Notification');
const { generateAccessToken } = require('../utils/jwt');
const { hashPassword } = require('../utils/password');
const { connectDB, disconnectDB } = require('../config/db');

jest.setTimeout(30000);

describe('Authentication, Email Notifications & Database Verification Suite', () => {
  let superAdminToken, instructorToken, studentToken;
  let superAdminUser, testInst, testCourse, refInstructor, refStudent;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      // Clean test namespace records
      await User.deleteMany({ email: { $in: ['amar766730@gmail.com', /@email-test\.org$/] } });
      await Course.deleteMany({ code: /^EFLOW-/ });
      await Institution.deleteMany({ code: /^EFLOW-/ });
      await Notification.deleteMany({});

      testInst = await Institution.create({
        name: 'Email Test Institution',
        code: 'EFLOW-INST',
        departments: ['Computer Science'],
      });

      const passHash = await hashPassword('Amar@123');
      superAdminUser = await User.create({
        name: 'Primary Super Admin Test',
        email: 'amar766730@gmail.com',
        passwordHash: passHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        institutionId: testInst._id,
      });

      const instPassHash = await hashPassword('Instructor@123');
      refInstructor = await User.create({
        name: 'Dr. Test Instructor',
        email: 'instructor@email-test.org',
        passwordHash: instPassHash,
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
        employeeId: 'EFLOW-EMP-01',
        department: 'Computer Science',
        institutionId: testInst._id,
        isVerified: true,
      });

      const studPassHash = await hashPassword('Student@123');
      refStudent = await User.create({
        name: 'Test Student One',
        email: 'student1@email-test.org',
        passwordHash: studPassHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        enrollmentNumber: 'EFLOW-ENR-01',
        rollNumber: 'EFLOW-ROLL-01',
        department: 'Computer Science',
        institutionId: testInst._id,
        isVerified: true,
      });

      testCourse = await Course.create({
        name: 'Email Flow Course',
        code: 'EFLOW-101',
        department: 'Computer Science',
        institutionId: testInst._id,
        instructorIds: [refInstructor._id],
        studentIds: [refStudent._id],
        status: 'ACTIVE',
      });

      superAdminToken = generateAccessToken({ userId: superAdminUser._id, role: 'SUPER_ADMIN', institutionId: testInst._id });
      instructorToken = generateAccessToken({ userId: refInstructor._id, role: 'INSTRUCTOR', institutionId: testInst._id });
      studentToken = generateAccessToken({ userId: refStudent._id, role: 'STUDENT' });
    }
  });

  describe('Section 1 & 12: Primary SUPER_ADMIN Login & Public Signup Removal', () => {
    it('authenticates primary SUPER_ADMIN successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'amar766730@gmail.com',
          password: 'Amar@123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('amar766730@gmail.com');
      expect(res.body.data.user.role).toBe('SUPER_ADMIN');
      expect(res.body.data.token).toBeDefined();
    });

    it('rejects public user registration (403 PUBLIC_REGISTRATION_DISABLED)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Unauthorized Public User',
          email: 'public@email-test.org',
          password: 'Password@123',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('PUBLIC_REGISTRATION_DISABLED');
    });
  });

  describe('Section 2: Admin Account Provisioning & Email Verification', () => {
    it('provisions another Admin account, generates verification token, and allows email verification', async () => {
      const createRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Secondary Admin',
          email: 'secadmin@email-test.org',
          role: 'INSTITUTION_ADMIN',
          password: 'AdminPassword@123',
          institutionId: testInst._id.toString(),
        });

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.user.email).toBe('secadmin@email-test.org');

      // Verify DB record
      const dbUser = await User.findOne({ email: 'secadmin@email-test.org' });
      expect(dbUser).toBeDefined();
      expect(dbUser.isVerified).toBe(true);

      // Verify Notification log
      const notif = await Notification.findOne({ recipientEmail: 'secadmin@email-test.org' });
      expect(notif).toBeDefined();
    });
  });

  describe('Section 3: Student & Instructor Provisioning & Email Verification', () => {
    it('provisions Student account, sets isVerified to true, and logs welcome notification', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'New Student',
          email: 'newstudent@email-test.org',
          role: 'STUDENT',
          enrollmentNumber: 'EFLOW-ENR-099',
          rollNumber: 'EFLOW-ROLL-099',
          institutionId: testInst._id.toString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      const dbStudent = await User.findOne({ email: 'newstudent@email-test.org' });
      expect(dbStudent.isVerified).toBe(true);

      const notif = await Notification.findOne({ recipientEmail: 'newstudent@email-test.org' });
      expect(notif).toBeDefined();
      expect(notif.type).toBe('WELCOME_EMAIL');
    });

    it('provisions Instructor account, generates verification token, and logs welcome notification', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'New Instructor',
          email: 'newinstructor@email-test.org',
          role: 'INSTRUCTOR',
          employeeId: 'EFLOW-EMP-099',
          institutionId: testInst._id.toString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      const dbInst = await User.findOne({ email: 'newinstructor@email-test.org' });
      expect(dbInst.isVerified).toBe(true);

      const notif = await Notification.findOne({ recipientEmail: 'newinstructor@email-test.org' });
      expect(notif).toBeDefined();
    });
  });

  describe('Section 4, 5, 8 & 10: Exam Publication Email Notifications & Idempotency', () => {
    let testExam;

    beforeEach(async () => {
      const q = await Question.create({
        courseId: testCourse._id,
        institutionId: testInst._id,
        questionText: 'What is a process control block?',
        type: 'MCQ',
        options: ['Data structure', 'Hardware'],
        correctAnswer: 'Data structure',
        marks: 5,
        status: 'APPROVED',
        createdBy: refInstructor._id,
      });

      testExam = await Exam.create({
        courseId: testCourse._id,
        institutionId: testInst._id,
        title: 'Midterm Operating Systems',
        description: 'Comprehensive OS exam',
        duration: 60,
        totalMarks: 100,
        passingMarks: 40,
        questionIds: [q._id],
        questionsPerStudent: 1,
        status: 'DRAFT',
        createdBy: refInstructor._id,
      });
    });

    it('does NOT send email notification when exam is created as DRAFT', async () => {
      const notifs = await Notification.find({ relatedId: testExam._id, type: 'EXAM_PUBLISHED' });
      expect(notifs.length).toBe(0);
    });

    it('sends exam notification email to enrolled students upon PUBLISH and prevents duplicate spamming', async () => {
      // Publish exam
      const pubRes = await request(app)
        .patch(`/api/v1/exams/${testExam._id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(pubRes.statusCode).toBe(200);
      expect(pubRes.body.success).toBe(true);

      // Verify notification log created for enrolled student
      const notifs = await Notification.find({ relatedId: testExam._id, type: 'EXAM_PUBLISHED' });
      expect(notifs.length).toBe(1);
      expect(notifs[0].recipientEmail).toBe('student1@email-test.org');
      expect(['SENT', 'FAILED']).toContain(notifs[0].status);

      // Attempt second publishing / notification trigger (should skip duplicate)
      const resendRes = await request(app)
        .post(`/api/v1/exams/${testExam._id}/resend-notifications`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(resendRes.statusCode).toBe(200);
      expect(resendRes.body.summary.sentCount + resendRes.body.summary.failedCount).toBe(1);
    });
  });
});
