const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const config = require('../../src/config/env');
const User = require('../../src/models/User');
const Institution = require('../../src/models/Institution');
const Course = require('../../src/models/Course');
const Question = require('../../src/models/Question');
const Exam = require('../../src/models/Exam');
const ExamAttempt = require('../../src/models/ExamAttempt');
const { generateAccessToken } = require('../../src/utils/jwt');
const { hashPassword } = require('../../src/utils/password');

describe('Integration Test: Instructor Workspace & Official Exam Engine', () => {
  jest.setTimeout(60000);

  let instA;
  let instructorA, instructorAToken;
  let unassignedInstructor, unassignedInstructorToken;
  let studentA, studentAToken;
  let courseA, question1, question2, draftQuestion;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://127.0.0.1:27017/examforge_test');
    }

    const passHash = '$2b$10$wT8d0v8N8V1Bq8j8z8e8u.123456789012345678901234567890';

    // Create Institution
    instA = await Institution.create({ name: 'Academic Inst', code: `ACAD_${Date.now()}` });

    // Create Assigned Instructor
    instructorA = await User.create({
      name: 'Assigned Instructor',
      email: `inst_assigned_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'INSTRUCTOR',
      institutionId: instA._id,
    });
    instructorAToken = generateAccessToken({ userId: instructorA._id, role: instructorA.role, institutionId: instA._id });

    // Create Unassigned Instructor
    unassignedInstructor = await User.create({
      name: 'Unassigned Instructor',
      email: `inst_unassigned_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'INSTRUCTOR',
      institutionId: instA._id,
    });
    unassignedInstructorToken = generateAccessToken({ userId: unassignedInstructor._id, role: unassignedInstructor.role, institutionId: instA._id });

    // Create Student
    studentA = await User.create({
      name: 'Enrolled Student',
      email: `stud_enrolled_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'STUDENT',
      institutionId: instA._id,
    });
    studentAToken = generateAccessToken({ userId: studentA._id, role: studentA.role, institutionId: instA._id });

    // Create Course
    courseA = await Course.create({
      institutionId: instA._id,
      code: `CS301_${Date.now()}`,
      name: 'Operating System Engine Test',
      department: 'CSE',
      instructorIds: [instructorA._id],
      studentIds: [studentA._id],
    });

    // Create Approved Questions
    question1 = await Question.create({
      courseId: courseA._id,
      institutionId: instA._id,
      type: 'MCQ',
      questionText: 'What manages process scheduling in OS?',
      options: ['CPU Scheduler', 'Memory Manager', 'File System', 'Network Stack'],
      correctAnswer: 'CPU Scheduler',
      difficulty: 'MEDIUM',
      topic: 'Process Scheduling',
      createdBy: instructorA._id,
      generationSource: 'AI_RAG',
      status: 'APPROVED',
    });

    question2 = await Question.create({
      courseId: courseA._id,
      institutionId: instA._id,
      type: 'TRUE_FALSE',
      questionText: 'Kernel mode has full access to hardware resources.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      difficulty: 'EASY',
      topic: 'Memory Management',
      createdBy: instructorA._id,
      generationSource: 'AI_RAG',
      status: 'APPROVED',
    });

    // Create Draft Question
    draftQuestion = await Question.create({
      courseId: courseA._id,
      institutionId: instA._id,
      type: 'MCQ',
      questionText: 'Draft question not yet approved',
      options: ['Opt A', 'Opt B'],
      correctAnswer: 'Opt A',
      createdBy: instructorA._id,
      generationSource: 'AI_RAG',
      status: 'DRAFT',
    });
  });

  afterAll(async () => {
    if (courseA?._id) {
      await ExamAttempt.deleteMany({ courseId: courseA._id });
      await Exam.deleteMany({ courseId: courseA._id });
      await Question.deleteMany({ courseId: courseA._id });
      await Course.deleteMany({ _id: courseA._id });
    }
    if (instructorA?._id || unassignedInstructor?._id || studentA?._id) {
      await User.deleteMany({ _id: { $in: [instructorA?._id, unassignedInstructor?._id, studentA?._id].filter(Boolean) } });
    }
    if (instA?._id) await Institution.deleteMany({ _id: instA._id });
  });

  it('1. GET /api/v1/exams/instructor/analytics - Instructor fetches real MongoDB analytics for assigned courses', async () => {
    const res = await request(app)
      .get('/api/v1/exams/instructor/analytics')
      .set('Authorization', `Bearer ${instructorAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.coursesCount).toBe(1);
    expect(res.body.data.stats.approvedQuestionsCount).toBe(2);
  });

  it('2. POST /api/v1/exams - Unassigned instructor is blocked (HTTP 403) from creating an exam for course', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${unassignedInstructorToken}`)
      .send({
        courseId: courseA._id,
        title: 'Unauthorized Exam Attempt',
        questionIds: [question1._id],
      });

    expect(res.status).toBe(403);
  });

  it('3. POST /api/v1/exams - Unapproved DRAFT questions cannot enter an official exam', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        courseId: courseA._id,
        title: 'Exam With Draft Question',
        questionIds: [question1._id, draftQuestion._id],
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNAPPROVED_QUESTION_SELECTION');
  });

  it('4. POST /api/v1/exams - Assigned instructor creates official exam with APPROVED questions', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        courseId: courseA._id,
        title: 'CS301 Midterm Exam 2026',
        description: 'Official midterm evaluation',
        duration: 45,
        totalMarks: 100,
        passingMarks: 50,
        questionIds: [question1._id, question2._id],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.exam.status).toBe('DRAFT');

    const createdExamId = res.body.data.exam.id || res.body.data.exam._id;

    // Publish Exam
    const pubRes = await request(app)
      .patch(`/api/v1/exams/${createdExamId}/publish`)
      .set('Authorization', `Bearer ${instructorAToken}`);

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.exam.status).toBe('PUBLISHED');
  });

  it('5. GET /api/v1/exams/student - Enrolled student fetches published course exams', async () => {
    const res = await request(app)
      .get('/api/v1/exams/student')
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.exams.length).toBeGreaterThan(0);
    expect(res.body.data.exams[0].title).toBe('CS301 Midterm Exam 2026');
  });

  it('6. POST /api/v1/exams/:id/start & submit - Student starts exam attempt, submits, and gets graded with AI analysis', async () => {
    const studentExamsRes = await request(app)
      .get('/api/v1/exams/student')
      .set('Authorization', `Bearer ${studentAToken}`);

    const targetExam = studentExamsRes.body.data.exams[0];
    const examId = targetExam.id || targetExam._id;

    // Start Attempt
    const startRes = await request(app)
      .post(`/api/v1/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(startRes.status).toBe(200);
    expect(startRes.body.data.attempt.status).toBe('IN_PROGRESS');

    const attemptId = startRes.body.data.attempt.id || startRes.body.data.attempt._id;
    const initialQuestionIds = startRes.body.data.attempt.questionIds || [];

    // Resume Attempt (refresh verification) - should return exact same attempt & question set
    const resumeRes = await request(app)
      .post(`/api/v1/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentAToken}`);

    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.attempt.id || resumeRes.body.data.attempt._id).toBe(attemptId);

    // Submit Attempt
    const submitRes = await request(app)
      .post(`/api/v1/exams/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({
        answers: [
          { questionId: question1._id, selectedOption: 'CPU Scheduler' },
          { questionId: question2._id, selectedOption: 'True' },
        ],
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.attempt.status).toBe('GRADED');
    expect(submitRes.body.data.attempt.percentage).toBe(100);
    expect(submitRes.body.data.attempt.passed).toBe(true);
    expect(submitRes.body.data.attempt.aiAnalysis.recommendations.length).toBeGreaterThan(0);
  });

  it('7. Schedule validation - Exam with invalid start/end schedule is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        courseId: courseA._id,
        title: 'Invalid Schedule Exam',
        duration: 60,
        questionIds: [question1._id],
        startTime: '2026-10-15T10:00:00Z',
        endTime: '2026-10-15T09:00:00Z',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_EXAM_SCHEDULE');
  });

  it('8. Difficulty distribution validation - Reject when sum of Easy+Medium+Hard != Total', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/generate-questions`)
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        numberOfQuestions: 10,
        difficultyDistribution: { easy: 5, medium: 2, hard: 1 }, // sum = 8 != 10
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DIFFICULTY_DISTRIBUTION');
  });
});
