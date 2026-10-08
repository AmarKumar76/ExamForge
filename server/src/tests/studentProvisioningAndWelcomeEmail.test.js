const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Notification = require('../models/Notification');
const { generateAccessToken } = require('../utils/jwt');
const { hashPassword } = require('../utils/password');
const { connectDB, disconnectDB } = require('../config/db');

jest.setTimeout(30000);

describe('Student Provisioning & Welcome Email Flow Suite', () => {
  let superAdminToken;
  let superAdminUser, testInst;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Institution.deleteMany({ code: /^PROV-/ });
      await Notification.deleteMany({});
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Institution.deleteMany({ code: /^PROV-/ });
      await Notification.deleteMany({});

      testInst = await Institution.create({
        name: 'Provisioning Test Institution',
        code: 'PROV-INST',
        departments: ['Computer Science'],
      });

      const passHash = await hashPassword('Amar@123');
      superAdminUser = await User.create({
        name: 'Primary Super Admin',
        email: 'amar766730@gmail.com',
        passwordHash: passHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        institutionId: testInst._id,
      });

      superAdminToken = generateAccessToken(superAdminUser);
    }
  });

  test('1. Admin-created Student has isVerified = true, null verificationToken, and hashed password', async () => {
    const studentEmail = 'newstudent@provtest.org';
    const studentPass = 'StudentTemp@123';

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Auto Verified Student',
        email: studentEmail,
        password: studentPass,
        role: 'STUDENT',
        department: 'Computer Science',
        institutionId: testInst._id,
        enrollmentNumber: 'PROV-ENR-01',
        rollNumber: 'PROV-ROLL-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('STUDENT');

    // Query database directly to verify stored document
    const createdDoc = await User.findOne({ email: studentEmail }).select('+passwordHash');
    expect(createdDoc).toBeDefined();
    expect(createdDoc.isVerified).toBe(true);
    expect(createdDoc.verificationToken).toBeNull();
    expect(createdDoc.verificationTokenExpires).toBeNull();
    expect(createdDoc.passwordHash).not.toBe(studentPass);
    expect(createdDoc.passwordHash).toMatch(/^\$2[abxy]\$/);
  });

  test('2. Admin-created Student can log in immediately without email verification step', async () => {
    const studentEmail = 'logincheck@provtest.org';
    const studentPass = 'StudentTemp@123';

    await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Immediate Login Student',
        email: studentEmail,
        password: studentPass,
        role: 'STUDENT',
        institutionId: testInst._id,
      });

    // Attempt login immediately
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: studentEmail,
        password: studentPass,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.email).toBe(studentEmail);
    expect(loginRes.body.data.token).toBeDefined();
  });

  test('3. Admin-created Instructor has isVerified = true and can log in immediately', async () => {
    const instEmail = 'instructor@provtest.org';
    const instPass = 'FacultyTemp@123';

    const createRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Faculty Instructor',
        email: instEmail,
        password: instPass,
        role: 'INSTRUCTOR',
        employeeId: 'PROV-EMP-01',
        institutionId: testInst._id,
      });

    expect(createRes.status).toBe(201);

    const doc = await User.findOne({ email: instEmail });
    expect(doc.isVerified).toBe(true);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: instEmail,
        password: instPass,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
  });

  test('4. Resend Welcome Email endpoint (POST /api/v1/users/:id/resend-welcome-email) triggers welcome email dispatch', async () => {
    const studentEmail = 'resendtarget@provtest.org';

    const createRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Resend Target Student',
        email: studentEmail,
        role: 'STUDENT',
        institutionId: testInst._id,
      });

    const studentId = createRes.body.data.user.id || createRes.body.data.user._id;

    const resendRes = await request(app)
      .post(`/api/v1/users/${studentId}/resend-welcome-email`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resendRes.status).toBe(200);
    expect(resendRes.body.data.welcomeEmailSent).toBeDefined();
  });
});
