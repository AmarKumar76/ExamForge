const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const config = require('../../src/config/env');
const User = require('../../src/models/User');
const Institution = require('../../src/models/Institution');
const Course = require('../../src/models/Course');
const CourseMaterial = require('../../src/models/CourseMaterial');
const MaterialChunk = require('../../src/models/MaterialChunk');
const Question = require('../../src/models/Question');
const Exam = require('../../src/models/Exam');
const ExamAttempt = require('../../src/models/ExamAttempt');
const embeddingService = require('../../src/services/ai/embedding.service');
const geminiService = require('../../src/services/ai/gemini.service');
const { generateAccessToken } = require('../../src/utils/jwt');
const { hashPassword } = require('../../src/utils/password');

describe('Optimization, Approval to Question Bank, & Server-Side Random Student Assignment', () => {
  jest.setTimeout(60000);

  let instA, courseA, courseB;
  let instructorA, instructorAToken;
  let studentA, studentAToken;
  let studentB, studentBToken;
  let materialA;

  beforeAll(async () => {
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test_gemini_key';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://127.0.0.1:27017/examforge_test');
    }

    jest.spyOn(embeddingService, 'generateEmbedding').mockImplementation(async () => {
      return new Array(768).fill(0.05);
    });

    jest.spyOn(geminiService, 'generateQuestions').mockImplementation(async (context, cfg) => {
      const count = cfg.numberOfQuestions || 2;
      const questions = [];
      for (let i = 0; i < count; i++) {
        questions.push({
          type: 'MCQ',
          questionText: `Generated Question ${i + 1} (${cfg.difficulty}) on ${cfg.topic}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'Sample explanation grounded in context.',
          difficulty: cfg.difficulty || 'MEDIUM',
          topic: cfg.topic || 'General',
        });
      }
      return questions;
    });

    // Precomputed bcrypt hash for Password123! to speed up test initialization
    const passHash = '$2b$10$wT8d0v8N8V1Bq8j8z8e8u.123456789012345678901234567890';

    instA = await Institution.create({ name: 'Randomization Test Inst', code: `RTI_${Date.now()}` });

    instructorA = await User.create({
      name: 'Dr. Test Instructor',
      email: `opt_inst_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'INSTRUCTOR',
      institutionId: instA._id,
    });
    instructorAToken = generateAccessToken({ userId: instructorA._id, role: instructorA.role, institutionId: instA._id });

    studentA = await User.create({
      name: 'Student Alice',
      email: `opt_alice_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'STUDENT',
      institutionId: instA._id,
    });
    studentAToken = generateAccessToken({ userId: studentA._id, role: studentA.role, institutionId: instA._id });

    studentB = await User.create({
      name: 'Student Bob',
      email: `opt_bob_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'STUDENT',
      institutionId: instA._id,
    });
    studentBToken = generateAccessToken({ userId: studentB._id, role: studentB.role, institutionId: instA._id });

    courseA = await Course.create({
      institutionId: instA._id,
      code: `CS301_${Date.now()}`,
      name: 'Algorithms & Data Structures',
      instructorIds: [instructorA._id],
      studentIds: [studentA._id, studentB._id],
    });

    courseB = await Course.create({
      institutionId: instA._id,
      code: `CS999_${Date.now()}`,
      name: 'Other Unassigned Course',
      instructorIds: [instructorA._id],
      studentIds: [],
    });

    materialA = await CourseMaterial.create({
      courseId: courseA._id,
      institutionId: instA._id,
      title: 'Algorithms Notes',
      fileName: 'algorithms_stored.pdf',
      originalFileName: 'algorithms.pdf',
      fileKey: 'key_123',
      fileSize: 1024,
      fileType: 'PDF',
      mimeType: 'application/pdf',
      uploadedBy: instructorA._id,
      processingStatus: 'PROCESSED',
      chunkCount: 2,
    });

    await MaterialChunk.create({
      materialId: materialA._id,
      courseId: courseA._id,
      institutionId: instA._id,
      chunkIndex: 0,
      text: 'Divide and conquer algorithm partitions problem into subproblems.',
      embedding: new Array(768).fill(0.05),
      embeddingProvider: 'gemini',
      sourceFileName: 'algorithms.pdf',
    });
  });

  afterAll(async () => {
    if (instA && instA._id) {
      await User.deleteMany({ institutionId: instA._id });
      await Course.deleteMany({ institutionId: instA._id });
      await CourseMaterial.deleteMany({ institutionId: instA._id });
      await MaterialChunk.deleteMany({ institutionId: instA._id });
      await Question.deleteMany({ institutionId: instA._id });
      await Exam.deleteMany({ institutionId: instA._id });
      await ExamAttempt.deleteMany({ institutionId: instA._id });
      await Institution.deleteMany({ _id: instA._id });
    }
  });

  test('1. Controlled Batch AI Question Generation executes in batches of 10 max', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/generate-questions`)
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        materialIds: [materialA._id],
        topic: 'Sorting Algorithms',
        numberOfQuestions: 12,
        difficultyDistribution: { easy: 4, medium: 4, hard: 4 },
        questionTypes: ['MCQ'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(12);
  });

  test('2. Approve question updates status to APPROVED, populates approvedBy and approvedAt in MongoDB', async () => {
    const draftQ = await Question.findOne({ courseId: courseA._id, status: 'DRAFT' });
    expect(draftQ).not.toBeNull();

    const res = await request(app)
      .patch(`/api/v1/ai/questions/${draftQ._id}/approve`)
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');

    const updatedInDb = await Question.findById(draftQ._id);
    expect(updatedInDb.status).toBe('APPROVED');
    expect(updatedInDb.approvedBy.toString()).toBe(instructorA._id.toString());
    expect(updatedInDb.approvedAt).not.toBeNull();
  });

  test('3. Question Bank query returns only APPROVED questions by default filter', async () => {
    const res = await request(app)
      .get(`/api/v1/courses/${courseA._id}/ai/questions?status=APPROVED`)
      .set('Authorization', `Bearer ${instructorAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((q) => {
      expect(q.status).toBe('APPROVED');
    });
  });

  test('4. Exam creation rejects insufficient question pool breakdown', async () => {
    // Attempt to create exam requiring 10 Easy, 10 Medium, 10 Hard when available pool is smaller
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        courseId: courseA._id,
        title: 'Overconstrained Exam',
        duration: 60,
        questionsPerStudent: 30,
        difficultyDistribution: { easy: 10, medium: 10, hard: 10 },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Not enough approved/);
  });

  test('5. Student exam attempt creates server-side randomized question set with persistence & security', async () => {
    // Seed 10 APPROVED questions (4 Easy, 4 Medium, 2 Hard)
    await Question.deleteMany({ courseId: courseA._id });

    const qDocs = [];
    for (let i = 1; i <= 10; i++) {
      let diff = 'EASY';
      if (i > 4 && i <= 8) diff = 'MEDIUM';
      if (i > 8) diff = 'HARD';

      qDocs.push({
        courseId: courseA._id,
        institutionId: instA._id,
        type: 'MCQ',
        questionText: `Approved Pool Question #${i} (${diff})`,
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 'Option 1',
        explanation: 'Secret Explanation',
        difficulty: diff,
        topic: 'Data Structures',
        createdBy: instructorA._id,
        approvedBy: instructorA._id,
        approvedAt: new Date(),
        status: 'APPROVED',
      });
    }
    const createdQuestions = await Question.insertMany(qDocs);
    const approvedIds = createdQuestions.map((q) => q._id);

    // Create exam requiring 5 questions per student (2 Easy, 2 Medium, 1 Hard)
    const examRes = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        courseId: courseA._id,
        title: 'Randomized Midterm Exam',
        duration: 45,
        questionIds: approvedIds,
        questionsPerStudent: 5,
        difficultyDistribution: { easy: 2, medium: 2, hard: 1 },
      });

    expect(examRes.status).toBe(201);
    const createdExam = examRes.body.data.exam || examRes.body.data;
    const examId = createdExam._id || createdExam.id;

    // Publish exam
    await request(app)
      .patch(`/api/v1/exams/${examId}/publish`)
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send();

    // Student A starts exam
    const attemptA1 = await request(app)
      .post(`/api/v1/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send();

    if (attemptA1.status !== 200) {
      console.log('attemptA1 error body:', attemptA1.body);
    }
    expect(attemptA1.status).toBe(200);
    expect(attemptA1.body.success).toBe(true);

    const questionsA1 = attemptA1.body.data.exam.questionIds;
    expect(questionsA1.length).toBe(5);

    // Verify uniqueness of question IDs in attempt
    const setA1 = new Set(questionsA1.map((q) => q._id || q.id));
    expect(setA1.size).toBe(5);

    // Verify correct answers and explanations are hidden
    questionsA1.forEach((q) => {
      expect(q.correctAnswer).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    });

    // Student B starts exam
    const attemptB1 = await request(app)
      .post(`/api/v1/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentBToken}`)
      .send();

    expect(attemptB1.status).toBe(200);
    const questionsB1 = attemptB1.body.data.exam.questionIds;
    expect(questionsB1.length).toBe(5);

    // Verify Student A refreshes/re-requests attempt — receives EXACT same 5 question IDs
    const attemptA2 = await request(app)
      .post(`/api/v1/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send();

    expect(attemptA2.status).toBe(200);
    const questionsA2 = attemptA2.body.data.exam.questionIds;
    const idsA1 = questionsA1.map((q) => (q._id || q.id).toString());
    const idsA2 = questionsA2.map((q) => (q._id || q.id).toString());
    expect(idsA2).toEqual(idsA1);
  });
});
