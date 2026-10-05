const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const config = require('../../src/config/env');
const User = require('../../src/models/User');
const Institution = require('../../src/models/Institution');
const Course = require('../../src/models/Course');
const AuditLog = require('../../src/models/AuditLog');
const SystemLog = require('../../src/models/SystemLog');
const { generateAccessToken } = require('../../src/utils/jwt');
const { hashPassword } = require('../../src/utils/password');

describe('Integration Test: Admin Workspace APIs', () => {
  jest.setTimeout(30000);

  let instA, adminUser, adminToken;
  let instructorUser, studentUser;
  let courseA;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://127.0.0.1:27017/examforge_test');
    }

    const passHash = await hashPassword('Password123!');

    // Create Institution
    instA = await Institution.create({ name: 'Admin Test Inst', code: `ATI_${Date.now()}` });

    // Create Admin User
    adminUser = await User.create({
      name: 'Admin Tester',
      email: `admin_workspace_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'SUPER_ADMIN',
      institutionId: instA._id,
    });
    adminToken = generateAccessToken({ userId: adminUser._id, role: adminUser.role, institutionId: instA._id });

    // Create Instructor User
    instructorUser = await User.create({
      name: 'Faculty Instructor',
      email: `faculty_inst_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'INSTRUCTOR',
      institutionId: instA._id,
    });

    // Create Student User
    studentUser = await User.create({
      name: 'Campus Student',
      email: `campus_stud_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'STUDENT',
      institutionId: instA._id,
    });

    // Create Course
    courseA = await Course.create({
      institutionId: instA._id,
      code: `ADM_${Date.now()}`,
      name: 'Admin Architecture Course',
      department: 'CSE',
      instructorIds: [instructorUser._id],
      studentIds: [studentUser._id],
    });
  });

  afterAll(async () => {
    if (courseA?._id) await Course.deleteMany({ _id: courseA._id });
    if (adminUser?._id || instructorUser?._id || studentUser?._id) {
      await User.deleteMany({ _id: { $in: [adminUser?._id, instructorUser?._id, studentUser?._id].filter(Boolean) } });
    }
    if (instA?._id) await Institution.deleteMany({ _id: instA._id });
    await AuditLog.deleteMany({});
    await SystemLog.deleteMany({});
  });

  it('1. GET /api/v1/users - Admin fetches user directory with populated course mappings', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);

    const instInList = res.body.data.users.find((u) => u.email === instructorUser.email);
    expect(instInList).toBeDefined();
    expect(instInList.assignedCourses.length).toBeGreaterThan(0);

    const studInList = res.body.data.users.find((u) => u.email === studentUser.email);
    expect(studInList).toBeDefined();
    expect(studInList.enrolledCourses.length).toBeGreaterThan(0);
  });

  it('2. GET /api/v1/users/:id - Admin fetches single user profile with course relationships', async () => {
    const res = await request(app)
      .get(`/api/v1/users/${instructorUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(instructorUser.email);
    expect(res.body.data.user.assignedCourses.length).toBe(1);
    expect(res.body.data.user.assignedCourses[0].code).toBe(courseA.code);
  });

  it('3. POST /api/v1/users - Admin creates new user account and creates audit/system log entries', async () => {
    const newEmail = `new_account_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Created By Admin',
        email: newEmail,
        password: 'Password123!',
        role: 'INSTRUCTOR',
        institutionId: instA._id,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(newEmail);

    // Clean created user
    await User.deleteMany({ email: newEmail });
  });

  it('4. PATCH /api/v1/users/:id/status - Admin suspends and activates user status', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${studentUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe('SUSPENDED');

    // Re-activate
    const res2 = await request(app)
      .patch(`/api/v1/users/${studentUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(res2.status).toBe(200);
    expect(res2.body.data.user.status).toBe('ACTIVE');
  });

  it('5. GET /api/v1/admin/analytics - Admin retrieves real database analytics and course breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.totalCourses).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.courseBreakdown)).toBe(true);
  });

  it('6. GET /api/v1/admin/audit-logs & system-logs - Admin retrieves audit and system operation logs', async () => {
    const auditRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(Array.isArray(auditRes.body.data.logs)).toBe(true);

    const sysRes = await request(app)
      .get('/api/v1/admin/system-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(sysRes.status).toBe(200);
    expect(sysRes.body.success).toBe(true);
    expect(Array.isArray(sysRes.body.data.logs)).toBe(true);
  });
});
