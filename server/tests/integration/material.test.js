const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../../src/app');
const config = require('../../src/config/env');
const User = require('../../src/models/User');
const Institution = require('../../src/models/Institution');
const Course = require('../../src/models/Course');
const CourseMaterial = require('../../src/models/CourseMaterial');
const { generateAccessToken } = require('../../src/utils/jwt');
const { hashPassword } = require('../../src/utils/password');

describe('Integration Test: Course Material Management APIs', () => {
  jest.setTimeout(30000);
  let superAdminUser, superAdminToken;
  let instAdminA, instAdminAToken, instA;
  let instAdminB, instAdminBToken, instB;
  let instructorA, instructorAToken;
  let instructorB, instructorBToken;
  let studentA, studentAToken;
  let courseA, courseB;
  let uploadedMaterialId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://127.0.0.1:27017/examforge_test');
    }

    const passHash = await hashPassword('Password123!');

    // Create Institutions
    instA = await Institution.create({ name: 'Mat Inst A', code: `MIA_${Date.now()}` });
    instB = await Institution.create({ name: 'Mat Inst B', code: `MIB_${Date.now()}` });

    // Create Super Admin
    superAdminUser = await User.create({ name: 'SA', email: `sa_${Date.now()}@example.com`, passwordHash: passHash, role: 'SUPER_ADMIN' });
    superAdminToken = generateAccessToken({ userId: superAdminUser._id, role: superAdminUser.role });

    // Create Inst Admins
    instAdminA = await User.create({ name: 'IA A', email: `iaa_${Date.now()}@example.com`, passwordHash: passHash, role: 'INSTITUTION_ADMIN', institutionId: instA._id });
    instAdminAToken = generateAccessToken({ userId: instAdminA._id, role: instAdminA.role, institutionId: instA._id });

    instAdminB = await User.create({ name: 'IA B', email: `iab_${Date.now()}@example.com`, passwordHash: passHash, role: 'INSTITUTION_ADMIN', institutionId: instB._id });
    instAdminBToken = generateAccessToken({ userId: instAdminB._id, role: instAdminB.role, institutionId: instB._id });

    // Create Instructors
    instructorA = await User.create({ name: 'Inst A', email: `insta_${Date.now()}@example.com`, passwordHash: passHash, role: 'INSTRUCTOR', institutionId: instA._id });
    instructorAToken = generateAccessToken({ userId: instructorA._id, role: instructorA.role, institutionId: instA._id });

    instructorB = await User.create({ name: 'Inst B', email: `instb_${Date.now()}@example.com`, passwordHash: passHash, role: 'INSTRUCTOR', institutionId: instA._id });
    instructorBToken = generateAccessToken({ userId: instructorB._id, role: instructorB.role, institutionId: instA._id });

    // Create Student
    studentA = await User.create({ name: 'Stud A', email: `studa_${Date.now()}@example.com`, passwordHash: passHash, role: 'STUDENT', institutionId: instA._id });
    studentAToken = generateAccessToken({ userId: studentA._id, role: studentA.role, institutionId: instA._id });

    // Create Course A (assigned to Instructor A, enrolled Student A)
    courseA = await Course.create({
      institutionId: instA._id,
      name: 'Algorithms A',
      code: 'CS_MAT_A',
      instructorIds: [instructorA._id],
      studentIds: [studentA._id],
    });

    // Create Course B (assigned to Instructor B, Inst B)
    courseB = await Course.create({
      institutionId: instB._id,
      name: 'Physics B',
      code: 'PHY_MAT_B',
      instructorIds: [instructorB._id],
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /.*_.*@example\.com/ });
    if (instA) await Institution.findByIdAndDelete(instA._id);
    if (instB) await Institution.findByIdAndDelete(instB._id);
    if (courseA) await Course.findByIdAndDelete(courseA._id);
    if (courseB) await Course.findByIdAndDelete(courseB._id);
    await CourseMaterial.deleteMany({ courseId: { $in: [courseA?._id, courseB?._id] } });
    await mongoose.connection.close();
  });

  describe('1. Instructor Upload & Rejections', () => {
    it('should allow assigned instructor to upload a valid PDF material', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 Mock PDF Content');

      const res = await request(app)
        .post(`/api/v1/courses/${courseA.id}/materials`)
        .set('Authorization', `Bearer ${instructorAToken}`)
        .field('title', 'Data Structures Lecture 1')
        .field('description', 'Introduction to arrays and linked lists')
        .field('topic', 'Data Structures')
        .attach('file', pdfBuffer, 'lecture1.pdf');

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.material.title).toEqual('Data Structures Lecture 1');
      expect(res.body.data.material.fileType).toEqual('PDF');
      expect(res.body.data.material.visibility).toEqual('DRAFT');

      uploadedMaterialId = res.body.data.material.id;
    });

    it('should reject unsupported file formats (e.g. .exe file)', async () => {
      const exeBuffer = Buffer.from('MZ Executable Header Mock');

      const res = await request(app)
        .post(`/api/v1/courses/${courseA.id}/materials`)
        .set('Authorization', `Bearer ${instructorAToken}`)
        .field('title', 'Malicious Script')
        .attach('file', exeBuffer, 'script.exe');

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should forbid STUDENT from uploading material', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 Student PDF');

      const res = await request(app)
        .post(`/api/v1/courses/${courseA.id}/materials`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .field('title', 'Student Upload')
        .attach('file', pdfBuffer, 'student.pdf');

      expect(res.statusCode).toEqual(403);
    });

    it('should forbid unassigned instructor from uploading to another course', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 Other PDF');

      const res = await request(app)
        .post(`/api/v1/courses/${courseA.id}/materials`)
        .set('Authorization', `Bearer ${instructorBToken}`)
        .field('title', 'Unassigned Instructor Upload')
        .attach('file', pdfBuffer, 'unassigned.pdf');

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('2. Material List & Visibility Scoping', () => {
    it('should allow assigned instructor to view draft materials', async () => {
      const res = await request(app)
        .get(`/api/v1/courses/${courseA.id}/materials`)
        .set('Authorization', `Bearer ${instructorAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.materials.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT show DRAFT material to enrolled STUDENT', async () => {
      const res = await request(app)
        .get(`/api/v1/courses/${courseA.id}/materials`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      // Student should see 0 materials because it is still in DRAFT mode
      expect(res.body.data.materials.length).toEqual(0);
    });

    it('should allow assigned instructor to PUBLISH the material', async () => {
      const res = await request(app)
        .patch(`/api/v1/materials/${uploadedMaterialId}/publish`)
        .set('Authorization', `Bearer ${instructorAToken}`)
        .send({ publish: true });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.material.visibility).toEqual('PUBLISHED');
    });

    it('should show PUBLISHED material to enrolled STUDENT now', async () => {
      const res = await request(app)
        .get(`/api/v1/courses/${courseA.id}/materials`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.materials.length).toEqual(1);
      expect(res.body.data.materials[0].id).toEqual(uploadedMaterialId);
    });
  });

  describe('3. File Download & Security Controls', () => {
    it('should allow enrolled STUDENT to download PUBLISHED material', async () => {
      const res = await request(app)
        .get(`/api/v1/materials/${uploadedMaterialId}/download`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.header['content-type']).toContain('pdf');
    });

    it('should reject STUDENT attempting to publish/archive/delete material', async () => {
      const pubRes = await request(app)
        .patch(`/api/v1/materials/${uploadedMaterialId}/publish`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ publish: false });
      expect(pubRes.statusCode).toEqual(403);

      const delRes = await request(app)
        .delete(`/api/v1/materials/${uploadedMaterialId}`)
        .set('Authorization', `Bearer ${studentAToken}`);
      expect(delRes.statusCode).toEqual(403);
    });

    it('should forbid Institution Admin B from accessing Institution A material', async () => {
      const res = await request(app)
        .get(`/api/v1/materials/${uploadedMaterialId}`)
        .set('Authorization', `Bearer ${instAdminBToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should allow Super Admin global access to material details', async () => {
      const res = await request(app)
        .get(`/api/v1/materials/${uploadedMaterialId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.material.id).toEqual(uploadedMaterialId);
    });
  });

  describe('4. Archiving & Deletion', () => {
    it('should allow assigned instructor to ARCHIVE material', async () => {
      const res = await request(app)
        .patch(`/api/v1/materials/${uploadedMaterialId}/archive`)
        .set('Authorization', `Bearer ${instructorAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.material.status).toEqual('ARCHIVED');
    });

    it('should allow assigned instructor to DELETE material', async () => {
      const res = await request(app)
        .delete(`/api/v1/materials/${uploadedMaterialId}`)
        .set('Authorization', `Bearer ${instructorAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
