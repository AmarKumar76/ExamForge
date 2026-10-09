const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const SystemLog = require('../models/SystemLog');
const { generateAccessToken } = require('../utils/jwt');
const { hashPassword } = require('../utils/password');
const { connectDB, disconnectDB } = require('../config/db');

jest.setTimeout(30000);

describe('Admin Analytics Real-Data Counts & Dynamic Auto-Refresh Test Suite', () => {
  let superAdminToken;
  let superAdminUser, testInst;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: { $in: ['amar766730@gmail.com'], $regex: /@analyticstest\.org$/ } });
      await Course.deleteMany({ code: /^ANALYTICS-/ });
      await Institution.deleteMany({ code: /^ANALYTICS-/ });
      await SystemLog.deleteMany({ action: /^ANALYTICS_/ });
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: { $in: ['amar766730@gmail.com'], $regex: /@analyticstest\.org$/ } });
      await Course.deleteMany({ code: /^ANALYTICS-/ });
      await Institution.deleteMany({ code: /^ANALYTICS-/ });
      await SystemLog.deleteMany({ action: /^ANALYTICS_/ });

      testInst = await Institution.create({
        name: 'Analytics Test Institution',
        code: 'ANALYTICS-INST',
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

  test('1. Clean initial state returns Total Users = 1, Students = 0, Instructors = 0, System Alerts = 0', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { stats, recentUsers } = res.body.data;
    expect(stats.totalUsers).toBe(1);
    expect(stats.totalStudents).toBe(0);
    expect(stats.totalInstructors).toBe(0);
    expect(stats.superAdmins).toBe(1);
    expect(stats.systemAlertsCount).toBe(0);

    expect(recentUsers).toHaveLength(1);
    expect(recentUsers[0].email).toBe('amar766730@gmail.com');
  });

  test('2. Admin creates 1 Student -> Total Users becomes 2, Students becomes 1', async () => {
    const createStudentRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'John Student',
        email: 'student1@analyticstest.org',
        role: 'STUDENT',
        department: 'Computer Science',
        institutionId: testInst._id,
        enrollmentNumber: 'EN-101',
        rollNumber: 'RN-101',
        semester: 'Semester 1',
        batch: '2026',
      });

    expect(createStudentRes.status).toBe(201);

    const analyticsRes = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(analyticsRes.status).toBe(200);
    const { stats } = analyticsRes.body.data;
    expect(stats.totalUsers).toBe(2);
    expect(stats.totalStudents).toBe(1);
    expect(stats.totalInstructors).toBe(0);
  });

  test('3. Admin creates 1 Instructor -> Total Users becomes 3, Instructors becomes 1', async () => {
    // Create Student first
    await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'John Student',
        email: 'student1@analyticstest.org',
        role: 'STUDENT',
        department: 'Computer Science',
        institutionId: testInst._id,
        enrollmentNumber: 'EN-101',
        rollNumber: 'RN-101',
      });

    // Create Instructor
    const createInstRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Dr. Jane Instructor',
        email: 'instructor1@analyticstest.org',
        role: 'INSTRUCTOR',
        department: 'Computer Science',
        institutionId: testInst._id,
        employeeId: 'EMP-101',
      });

    expect(createInstRes.status).toBe(201);

    const analyticsRes = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(analyticsRes.status).toBe(200);
    const { stats } = analyticsRes.body.data;
    expect(stats.totalUsers).toBe(3);
    expect(stats.totalStudents).toBe(1);
    expect(stats.totalInstructors).toBe(1);
    expect(stats.superAdmins).toBe(1);
  });
});
