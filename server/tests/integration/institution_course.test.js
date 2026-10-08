const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const config = require('../../src/config/env');
const User = require('../../src/models/User');
const Institution = require('../../src/models/Institution');
const Course = require('../../src/models/Course');
const { generateAccessToken } = require('../../src/utils/jwt');
const { hashPassword } = require('../../src/utils/password');

describe('Integration Test: Institution & Course Management APIs', () => {
  jest.setTimeout(30000);
  let superAdminUser;
  let superAdminToken;
  let instAdminUser;
  let instAdminToken;
  let instructorUser;
  let instructorToken;
  let studentUser;
  let studentToken;
  let testInstitution;
  let testCourse;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://127.0.0.1:27017/examforge_test');
    }

    const passHash = await hashPassword('Password123!');

    // Create Test Institution
    testInstitution = await Institution.create({
      name: 'Integration Test Institute',
      code: `ITI_${Date.now()}`,
      departments: ['Computer Science', 'Mathematics'],
    });

    // Create Super Admin User
    superAdminUser = await User.create({
      name: 'Super Admin Test',
      email: `super_admin_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'SUPER_ADMIN',
    });
    superAdminToken = generateAccessToken({ userId: superAdminUser._id, role: superAdminUser.role });

    // Create Institution Admin User
    instAdminUser = await User.create({
      name: 'Inst Admin Test',
      email: `inst_admin_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'INSTITUTION_ADMIN',
      institutionId: testInstitution._id,
    });
    instAdminToken = generateAccessToken({ userId: instAdminUser._id, role: instAdminUser.role, institutionId: testInstitution._id });

    // Create Instructor User
    instructorUser = await User.create({
      name: 'Instructor Test',
      email: `instructor_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'INSTRUCTOR',
      institutionId: testInstitution._id,
    });
    instructorToken = generateAccessToken({ userId: instructorUser._id, role: instructorUser.role, institutionId: testInstitution._id });

    // Create Student User
    studentUser = await User.create({
      name: 'Student Test',
      email: `student_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'STUDENT',
      institutionId: testInstitution._id,
    });
    studentToken = generateAccessToken({ userId: studentUser._id, role: studentUser.role, institutionId: testInstitution._id });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /.*_.*@example\.com/ });
    await Institution.deleteMany({ code: /^(ITI|STI|AITI|MIA)_/i });
    await Course.deleteMany({ code: /^CS_/i });
    if (testInstitution) await Institution.findByIdAndDelete(testInstitution._id);
    if (testCourse) await Course.findByIdAndDelete(testCourse._id);
    await mongoose.connection.close();
  });

  describe('Institution APIs (/api/v1/institutions)', () => {
    it('should allow SUPER_ADMIN to create an institution', async () => {
      const res = await request(app)
        .post('/api/v1/institutions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Stanford Technology Institute',
          code: `STI_${Date.now()}`,
          departments: ['Engineering', 'Physics'],
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.institution.name).toEqual('Stanford Technology Institute');
    });

    it('should reject institution creation for STUDENT role', async () => {
      const res = await request(app)
        .post('/api/v1/institutions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Unauthorized Institute',
          code: 'UNAUTH',
        });

      expect(res.statusCode).toEqual(403);
    });

    it('should allow users to list institutions', async () => {
      const res = await request(app)
        .get('/api/v1/institutions')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.institutions)).toBe(true);
    });
  });

  describe('Course APIs (/api/v1/courses)', () => {
    it('should allow INSTITUTION_ADMIN to create a course', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${instAdminToken}`)
        .send({
          institutionId: testInstitution._id,
          department: 'Computer Science',
          name: 'Data Structures & Algorithms',
          code: 'CS301',
          description: 'Core computer science course covering fundamental algorithms.',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.course.code).toEqual('CS301');
      testCourse = res.body.data.course;
    });

    it('should reject duplicate course code within the same institution', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${instAdminToken}`)
        .send({
          institutionId: testInstitution._id,
          department: 'Computer Science',
          name: 'Duplicate DS Course',
          code: 'CS301',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.code).toEqual('DUPLICATE_COURSE_CODE');
    });

    it('should allow INSTITUTION_ADMIN to assign an instructor to a course and persist in database', async () => {
      const res = await request(app)
        .post(`/api/v1/courses/${testCourse.id}/instructors`)
        .set('Authorization', `Bearer ${instAdminToken}`)
        .send({
          instructorIds: [instructorUser._id.toString()],
          action: 'set',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // Verify Database persistence
      const updatedCourse = await Course.findById(testCourse.id);
      expect(updatedCourse.instructorIds.map((id) => id.toString())).toContain(instructorUser._id.toString());
    });

    it('should reject cross-institution instructor assignment', async () => {
      const otherInst = await Institution.create({
        name: 'Other Institute',
        code: `OTHER_${Date.now()}`,
      });

      const otherInstructor = await User.create({
        name: 'Other Inst Faculty',
        email: `other_faculty_${Date.now()}@example.com`,
        passwordHash: 'hashed',
        role: 'INSTRUCTOR',
        institutionId: otherInst._id,
      });

      const res = await request(app)
        .post(`/api/v1/courses/${testCourse.id}/instructors`)
        .set('Authorization', `Bearer ${instAdminToken}`)
        .send({
          instructorIds: [otherInstructor._id.toString()],
          action: 'add',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.code).toEqual('CROSS_INSTITUTION_INSTRUCTOR');

      await User.findByIdAndDelete(otherInstructor._id);
      await Institution.findByIdAndDelete(otherInst._id);
    });

    it('should reject unauthorized role attempting instructor assignment', async () => {
      const res = await request(app)
        .post(`/api/v1/courses/${testCourse.id}/instructors`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          instructorIds: [instructorUser._id.toString()],
          action: 'add',
        });

      expect(res.statusCode).toEqual(403);
    });

    it('should handle duplicate instructor assignment without duplicating IDs in DB', async () => {
      // Add instructor twice using 'add'
      await request(app)
        .post(`/api/v1/courses/${testCourse.id}/instructors`)
        .set('Authorization', `Bearer ${instAdminToken}`)
        .send({
          instructorIds: [instructorUser._id.toString(), instructorUser._id.toString()],
          action: 'add',
        });

      const updatedCourse = await Course.findById(testCourse.id);
      const count = updatedCourse.instructorIds.filter(
        (id) => id.toString() === instructorUser._id.toString()
      ).length;
      expect(count).toEqual(1);
    });

    it('should allow INSTRUCTOR to view assigned course', async () => {
      const res = await request(app)
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courses.some((c) => c.id === testCourse.id)).toBe(true);
    });

    it('should allow STUDENT to self-enroll in active course', async () => {
      const res = await request(app)
        .post(`/api/v1/courses/${testCourse.id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    it('should show enrolled course under STUDENT course list', async () => {
      const res = await request(app)
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courses.some((c) => c.id === testCourse.id)).toBe(true);
    });
  });
});
