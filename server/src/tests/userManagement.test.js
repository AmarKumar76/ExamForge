const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const { generateAccessToken } = require('../utils/jwt');
const { hashPassword } = require('../utils/password');
const { connectDB, disconnectDB } = require('../config/db');

jest.setTimeout(20000);

describe('Admin Student & Instructor Management Integration Tests', () => {
  let adminUser, adminToken, studentToken, instToken, testInst, testCourse1, testCourse2;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: /@mgmt-test\.org$/ });
      await Course.deleteMany({ code: /^MGMT-/ });
      await Institution.deleteMany({ code: /^MGMT-INST/ });
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: /@mgmt-test\.org$/ });
      await Course.deleteMany({ code: /^MGMT-/ });
      await Institution.deleteMany({ code: /^MGMT-INST/ });

      testInst = await Institution.create({
        name: 'Management Test Institute',
        code: 'MGMT-INST-01',
        departments: ['Computer Science', 'Information Technology'],
      });

      testCourse1 = await Course.create({
        institutionId: testInst._id,
        name: 'Data Structures',
        code: 'MGMT-CS101',
        department: 'Computer Science',
      });

      testCourse2 = await Course.create({
        institutionId: testInst._id,
        name: 'Database Systems',
        code: 'MGMT-CS102',
        department: 'Computer Science',
      });

      const passHash = await hashPassword('Admin@123');
      adminUser = await User.create({
        name: 'Admin Test Manager',
        email: 'superadmin@mgmt-test.org',
        passwordHash: passHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        institutionId: testInst._id,
      });

      const studentUser = await User.create({
        name: 'Student User',
        email: 'student@mgmt-test.org',
        passwordHash: passHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const instUser = await User.create({
        name: 'Instructor User',
        email: 'instructor@mgmt-test.org',
        passwordHash: passHash,
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      });

      adminToken = generateAccessToken({ userId: adminUser._id, role: 'SUPER_ADMIN', institutionId: testInst._id });
      studentToken = generateAccessToken({ userId: studentUser._id, role: 'STUDENT' });
      instToken = generateAccessToken({ userId: instUser._id, role: 'INSTRUCTOR' });
    }
  });

  describe('Manual Student Creation (POST /api/v1/users)', () => {
    it('creates a Student account with profile attributes without course assignment', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Manual Student A',
          email: 'studentA@mgmt-test.org',
          role: 'STUDENT',
          enrollmentNumber: 'ENR-2026-001',
          rollNumber: 'ROLL-CS-01',
          department: 'Computer Science',
          semester: '5',
          batch: '2023-2027',
          institutionId: testInst._id.toString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('studenta@mgmt-test.org');
      expect(res.body.data.user.enrollmentNumber).toBe('ENR-2026-001');
      expect(res.body.data.user.rollNumber).toBe('ROLL-CS-01');
      expect(res.body.data.user.enrolledCourses.length).toBe(0);

      // Verify single user account exists in DB
      const userCount = await User.countDocuments({ email: 'studenta@mgmt-test.org' });
      expect(userCount).toBe(1);
    });

    it('rejects duplicate email creation with 409 DUPLICATE_EMAIL', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student Existing',
          email: 'dup@mgmt-test.org',
          role: 'STUDENT',
        });

      const dupRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student Duplicate',
          email: 'dup@mgmt-test.org',
          role: 'STUDENT',
        });

      expect(dupRes.statusCode).toBe(409);
      expect(dupRes.body.code).toBe('DUPLICATE_EMAIL');
    });

    it('rejects duplicate enrollment number creation with 409 DUPLICATE_ENROLLMENT', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student 1',
          email: 'student1@mgmt-test.org',
          enrollmentNumber: 'SAME-ENR-999',
          role: 'STUDENT',
        });

      const dupRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student 2',
          email: 'student2@mgmt-test.org',
          enrollmentNumber: 'SAME-ENR-999',
          role: 'STUDENT',
        });

      expect(dupRes.statusCode).toBe(409);
      expect(dupRes.body.code).toBe('DUPLICATE_ENROLLMENT');
    });

    it('rejects duplicate roll number creation with 409 DUPLICATE_ROLL', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student R1',
          email: 'studentr1@mgmt-test.org',
          rollNumber: 'SAME-ROLL-111',
          role: 'STUDENT',
        });

      const dupRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student R2',
          email: 'studentr2@mgmt-test.org',
          rollNumber: 'SAME-ROLL-111',
          role: 'STUDENT',
        });

      expect(dupRes.statusCode).toBe(409);
      expect(dupRes.body.code).toBe('DUPLICATE_ROLL');
    });
  });

  describe('Manual Instructor Creation (POST /api/v1/users)', () => {
    it('creates an Instructor with employee ID without course assignment', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Instructor One',
          email: 'instone@mgmt-test.org',
          role: 'INSTRUCTOR',
          employeeId: 'EMP-9001',
          department: 'Computer Science',
          institutionId: testInst._id.toString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.employeeId).toBe('EMP-9001');
      expect(res.body.data.user.assignedCourses.length).toBe(0);
    });

    it('rejects duplicate employee ID creation with 409 DUPLICATE_EMPLOYEE_ID', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Instructor E1',
          email: 'inste1@mgmt-test.org',
          employeeId: 'SAME-EMP-888',
          role: 'INSTRUCTOR',
        });

      const dupRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Instructor E2',
          email: 'inste2@mgmt-test.org',
          employeeId: 'SAME-EMP-888',
          role: 'INSTRUCTOR',
        });

      expect(dupRes.statusCode).toBe(409);
      expect(dupRes.body.code).toBe('DUPLICATE_EMPLOYEE_ID');
    });
  });

  describe('Bulk Import (POST /api/v1/users/bulk-import)', () => {
    it('successfully bulk imports student records and tracks failures/duplicates in summary', async () => {
      const bulkPayload = {
        role: 'STUDENT',
        institutionId: testInst._id.toString(),
        records: [
          {
            Name: 'Bulk Student 1',
            Email: 'bulk1@mgmt-test.org',
            'Enrollment No': 'BULK-ENR-01',
            'Roll No': 'BULK-ROLL-01',
            Department: 'Computer Science',
            Semester: '3',
            Batch: '2024-2028',
          },
          {
            Name: 'Bulk Student 2',
            Email: 'bulk2@mgmt-test.org',
            'Enrollment No': 'BULK-ENR-02',
            'Roll No': 'BULK-ROLL-02',
            Department: 'Computer Science',
          },
          {
            // Invalid record missing name
            Name: '',
            Email: 'invalid@mgmt-test.org',
          },
          {
            // Duplicate email inside batch
            Name: 'Bulk Duplicate 1',
            Email: 'bulk1@mgmt-test.org',
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/users/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkPayload);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRows).toBe(4);
      expect(res.body.data.successCount).toBe(2);
      expect(res.body.data.failedCount).toBe(2);
      expect(res.body.data.failedRows.length).toBe(2);
    });
  });

  describe('RBAC Protection', () => {
    it('denies STUDENT role from creating user accounts (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Unauthorized Create',
          email: 'unauth@mgmt-test.org',
          role: 'STUDENT',
        });

      expect(res.statusCode).toBe(403);
    });

    it('denies INSTRUCTOR role from bulk importing user accounts (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/v1/users/bulk-import')
        .set('Authorization', `Bearer ${instToken}`)
        .send({
          role: 'STUDENT',
          records: [{ Name: 'Test', Email: 'test@mgmt-test.org' }],
        });

      expect(res.statusCode).toBe(403);
    });
  });
});
