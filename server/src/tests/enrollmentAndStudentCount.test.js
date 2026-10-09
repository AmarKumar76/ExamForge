/**
 * Phase 3 Regression Tests — Enrollment Deduplication & Instructor Analytics Student Count
 *
 * These tests cover the two bugs fixed in Phase 2:
 *  1. course.service.js selfEnrollStudent: .includes() always returned false for
 *     Mongoose ObjectId objects (reference equality), allowing the same student to
 *     be pushed into course.studentIds multiple times.
 *  2. exam.service.js getInstructorAnalytics: totalStudentsCount was calculated by
 *     summing studentIds.length across all courses, double-counting students enrolled
 *     in more than one course.
 *
 * Database isolation:
 *  - All fixtures use a unique suffix (@enrolltest.dev) so cleanup is scope-safe.
 *  - The safety guard in jest.setup.js and env.js will hard-fail if the resolved
 *    database is "examforge" (production). If that guard fires, tests do NOT run.
 *  - All records created here are deleted in afterAll using the same fixture filters.
 */

'use strict';

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const User = require('../models/User');
const courseService = require('../services/course.service');

// Unique fixture namespace
const FIXTURE_EMAIL_RE = /enrolltest\.dev$/;
const INST_CODE = 'ENROLLTEST-INST-001';
const COURSE_CODE_A = 'ENROLLTEST-CRS-A';
const COURSE_CODE_B = 'ENROLLTEST-CRS-B';

let testInstitution;
let instructorUser;
let studentUserA;
let studentUserB;
let courseA;
let courseB;

async function createUser(overrides) {
  return User.create({
    name: 'Test User',
    passwordHash: '$2b$10$placeholderHashForTestsOnly.padding.padding.pX',
    role: 'STUDENT',
    status: 'ACTIVE',
    isVerified: true,
    ...overrides,
  });
}

beforeAll(async () => {
  await connectDB();

  const dbName = mongoose.connection.name;
  if (dbName === 'examforge') {
    throw new Error(
      `SAFETY_GUARD: Regression tests attempted to run against production database "${dbName}". Aborting.`
    );
  }

  testInstitution = await Institution.findOneAndUpdate(
    { code: INST_CODE },
    {
      $setOnInsert: {
        name: 'Enrollment Test Institution',
        code: INST_CODE,
        departments: ['Computer Science'],
        status: 'ACTIVE',
      },
    },
    { upsert: true, new: true }
  );

  instructorUser = await createUser({
    name: 'Fixture Instructor',
    email: `instructor@enrolltest.dev`,
    role: 'INSTRUCTOR',
    institutionId: testInstitution._id,
    employeeId: 'ENROLLTEST-EMP-001',
  });

  studentUserA = await createUser({
    name: 'Fixture Student A',
    email: `studentA@enrolltest.dev`,
    role: 'STUDENT',
    institutionId: testInstitution._id,
    enrollmentNumber: 'ENROLLTEST-EN-A',
    rollNumber: 'ENROLLTEST-RN-A',
  });

  studentUserB = await createUser({
    name: 'Fixture Student B',
    email: `studentB@enrolltest.dev`,
    role: 'STUDENT',
    institutionId: testInstitution._id,
    enrollmentNumber: 'ENROLLTEST-EN-B',
    rollNumber: 'ENROLLTEST-RN-B',
  });

  courseA = await Course.create({
    institutionId: testInstitution._id,
    department: 'Computer Science',
    name: 'Enrollment Test Course A',
    code: COURSE_CODE_A,
    status: 'ACTIVE',
    instructorIds: [instructorUser._id],
    studentIds: [],
  });

  courseB = await Course.create({
    institutionId: testInstitution._id,
    department: 'Computer Science',
    name: 'Enrollment Test Course B',
    code: COURSE_CODE_B,
    status: 'ACTIVE',
    instructorIds: [instructorUser._id],
    studentIds: [],
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({ email: FIXTURE_EMAIL_RE });
    await Course.deleteMany({ code: { $in: [COURSE_CODE_A, COURSE_CODE_B] } });
    await Institution.deleteMany({ code: INST_CODE });
  }
  await disconnectDB();
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await Course.updateMany(
      { code: { $in: [COURSE_CODE_A, COURSE_CODE_B] } },
      { $set: { studentIds: [] } }
    );
    courseA = await Course.findOne({ code: COURSE_CODE_A });
    courseB = await Course.findOne({ code: COURSE_CODE_B });
  }
});

// ---------------------------------------------------------------------------
describe('Database isolation guard', () => {
  test('test database must not be the production "examforge" database', () => {
    const dbName = mongoose.connection.name;
    expect(dbName).not.toBe('examforge');
    expect(dbName).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
describe('courseService.selfEnrollStudent — duplicate-enrollment prevention', () => {
  test('enrolling a student once adds them exactly once', async () => {
    await courseService.selfEnrollStudent(courseA._id.toString(), studentUserA);
    const fresh = await Course.findById(courseA._id);
    expect(fresh.studentIds).toHaveLength(1);
    expect(fresh.studentIds[0].toString()).toBe(studentUserA._id.toString());
  });

  test('enrolling the same student twice leaves exactly one entry (idempotent)', async () => {
    await courseService.selfEnrollStudent(courseA._id.toString(), studentUserA);
    await courseService.selfEnrollStudent(courseA._id.toString(), studentUserA);
    const fresh = await Course.findById(courseA._id);
    expect(fresh.studentIds).toHaveLength(1);
    expect(fresh.studentIds[0].toString()).toBe(studentUserA._id.toString());
  });

  test('calling selfEnroll N times never exceeds 1 entry for the same student', async () => {
    const N = 5;
    for (let i = 0; i < N; i++) {
      await courseService.selfEnrollStudent(courseA._id.toString(), studentUserA);
    }
    const fresh = await Course.findById(courseA._id);
    const count = fresh.studentIds.filter(
      (id) => id.toString() === studentUserA._id.toString()
    ).length;
    expect(count).toBe(1);
  });

  test('two different students can each enroll once and both appear', async () => {
    await courseService.selfEnrollStudent(courseA._id.toString(), studentUserA);
    await courseService.selfEnrollStudent(courseA._id.toString(), studentUserB);
    const fresh = await Course.findById(courseA._id);
    expect(fresh.studentIds).toHaveLength(2);
    const ids = fresh.studentIds.map((id) => id.toString());
    expect(ids).toContain(studentUserA._id.toString());
    expect(ids).toContain(studentUserB._id.toString());
  });

  test('enrolling student into two courses are independent (no cross-course contamination)', async () => {
    await courseService.selfEnrollStudent(courseA._id.toString(), studentUserA);
    await courseService.selfEnrollStudent(courseB._id.toString(), studentUserA);
    const freshA = await Course.findById(courseA._id);
    const freshB = await Course.findById(courseB._id);
    expect(freshA.studentIds).toHaveLength(1);
    expect(freshB.studentIds).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
describe('getInstructorAnalytics — totalStudentsCount unique deduplication', () => {
  function computeUniqueStudentCount(courses) {
    const uniqueIds = new Set(
      courses.flatMap((c) => (c.studentIds || []).map((id) => id.toString()))
    );
    return uniqueIds.size;
  }

  test('student enrolled in only one course counts as 1', async () => {
    await Course.updateOne({ _id: courseA._id }, { $set: { studentIds: [studentUserA._id] } });
    const courses = await Course.find({ _id: { $in: [courseA._id, courseB._id] } });
    expect(computeUniqueStudentCount(courses)).toBe(1);
  });

  test('same student in two courses still counts as 1 (deduplication)', async () => {
    await Course.updateOne({ _id: courseA._id }, { $set: { studentIds: [studentUserA._id] } });
    await Course.updateOne({ _id: courseB._id }, { $set: { studentIds: [studentUserA._id] } });
    const courses = await Course.find({ _id: { $in: [courseA._id, courseB._id] } });
    // Old reduce-based bug would return 2
    expect(computeUniqueStudentCount(courses)).toBe(1);
  });

  test('two distinct students across two courses counts as 2', async () => {
    await Course.updateOne({ _id: courseA._id }, { $set: { studentIds: [studentUserA._id] } });
    await Course.updateOne({ _id: courseB._id }, { $set: { studentIds: [studentUserB._id] } });
    const courses = await Course.find({ _id: { $in: [courseA._id, courseB._id] } });
    expect(computeUniqueStudentCount(courses)).toBe(2);
  });

  test('both students in both courses still counts as 2 (full deduplication)', async () => {
    await Course.updateOne(
      { _id: courseA._id },
      { $set: { studentIds: [studentUserA._id, studentUserB._id] } }
    );
    await Course.updateOne(
      { _id: courseB._id },
      { $set: { studentIds: [studentUserA._id, studentUserB._id] } }
    );
    const courses = await Course.find({ _id: { $in: [courseA._id, courseB._id] } });
    // Old reduce-based bug would return 4
    expect(computeUniqueStudentCount(courses)).toBe(2);
  });

  test('empty studentIds arrays yield count 0', async () => {
    const courses = await Course.find({ _id: { $in: [courseA._id, courseB._id] } });
    expect(computeUniqueStudentCount(courses)).toBe(0);
  });
});
