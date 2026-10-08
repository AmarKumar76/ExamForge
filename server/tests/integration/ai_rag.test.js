const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');
const app = require('../../src/app');
const config = require('../../src/config/env');
const User = require('../../src/models/User');
const Institution = require('../../src/models/Institution');
const Course = require('../../src/models/Course');
const CourseMaterial = require('../../src/models/CourseMaterial');
const MaterialChunk = require('../../src/models/MaterialChunk');
const Question = require('../../src/models/Question');
const embeddingService = require('../../src/services/ai/embedding.service');
const geminiService = require('../../src/services/ai/gemini.service');
const { generateAccessToken } = require('../../src/utils/jwt');
const { hashPassword } = require('../../src/utils/password');

describe('Integration Test: Module 5 AI / RAG Question Generation Studio APIs', () => {
  jest.setTimeout(45000);

  let instA, courseA;
  let instructorA, instructorAToken;
  let studentA, studentAToken;
  let materialA, pptxMaterial;
  let tempFilePath, tempPptxPath;

  beforeAll(async () => {
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test_dummy_gemini_api_key_for_jest';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || config.mongoUri || 'mongodb://127.0.0.1:27017/examforge_test');
    }

    // Mock external Gemini API calls for automated test suite independence
    jest.spyOn(embeddingService, 'generateEmbedding').mockImplementation(async () => {
      return new Array(768).fill(0.05);
    });

    jest.spyOn(geminiService, 'generateQuestions').mockImplementation(async (context, cfg) => {
      return [
        {
          type: 'MCQ',
          questionText: 'What mode do OS processes run in according to context?',
          options: ['User or Kernel Mode', 'User Mode Only', 'Kernel Mode Only', 'Hypervisor Mode'],
          correctAnswer: 'User or Kernel Mode',
          explanation: 'Derived from source context.',
          difficulty: cfg.difficulty || 'MEDIUM',
          topic: cfg.topic || 'OS',
        },
        {
          type: 'MCQ',
          questionText: 'What manages CPU allocation according to context?',
          options: ['Process Scheduling', 'Virtual Memory', 'File System', 'Network Interface'],
          correctAnswer: 'Process Scheduling',
          explanation: 'Derived from source context.',
          difficulty: cfg.difficulty || 'MEDIUM',
          topic: cfg.topic || 'OS',
        },
      ];
    });

    const passHash = await hashPassword('Password123!');

    // Create Institution
    instA = await Institution.create({ name: 'AI Test Institution', code: `AITI_${Date.now()}` });

    // Create Instructor
    instructorA = await User.create({
      name: 'AI Instructor',
      email: `ai_inst_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'INSTRUCTOR',
      institutionId: instA._id,
    });
    instructorAToken = generateAccessToken({ userId: instructorA._id, role: instructorA.role, institutionId: instA._id });

    // Create Student
    studentA = await User.create({
      name: 'AI Student',
      email: `ai_student_${Date.now()}@example.com`,
      passwordHash: passHash,
      role: 'STUDENT',
      institutionId: instA._id,
    });
    studentAToken = generateAccessToken({ userId: studentA._id, role: studentA.role, institutionId: instA._id });

    // Create Course
    courseA = await Course.create({
      institutionId: instA._id,
      code: `CS_${Date.now()}`,
      name: 'Operating Systems AI Test',
      instructorIds: [instructorA._id],
      studentIds: [studentA._id],
    });

    // Create a temporary dummy text file with .pdf extension
    tempFilePath = path.join(__dirname, `test_doc_${Date.now()}.pdf`);
    fs.writeFileSync(
      tempFilePath,
      'Operating System processes run in user mode or kernel mode. Process scheduling manages CPU allocation. Virtual memory handles paging and segmentation.'
    );

    // Create a temporary valid PPTX file
    const zip = new JSZip();
    zip.file('ppt/slides/slide1.xml', '<p><a:t>PowerPoint Slide 1: Process Management Concepts</a:t></p>');
    zip.file('ppt/slides/slide2.xml', '<p><a:t>PowerPoint Slide 2: Virtual Memory Management</a:t></p>');
    const pptxBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    tempPptxPath = path.join(__dirname, `test_presentation_${Date.now()}.pptx`);
    fs.writeFileSync(tempPptxPath, pptxBuffer);

    // Upload PDF course material via API
    const uploadRes = await request(app)
      .post(`/api/v1/courses/${courseA._id}/materials`)
      .set('Authorization', `Bearer ${instructorAToken}`)
      .field('title', 'OS Fundamental Notes')
      .field('description', 'Lecture notes on scheduling and virtual memory')
      .field('topic', 'Operating Systems')
      .attach('file', tempFilePath);

    expect(uploadRes.status).toBe(201);
    materialA = uploadRes.body.data.material;

    // Upload PPTX material via API
    const uploadPptxRes = await request(app)
      .post(`/api/v1/courses/${courseA._id}/materials`)
      .set('Authorization', `Bearer ${instructorAToken}`)
      .field('title', 'OS Presentation Slides')
      .field('description', 'Slide deck for OS concepts')
      .field('topic', 'Operating Systems')
      .attach('file', tempPptxPath);

    expect(uploadPptxRes.status).toBe(201);
    pptxMaterial = uploadPptxRes.body.data.material;
  });

  afterAll(async () => {
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (tempPptxPath && fs.existsSync(tempPptxPath)) fs.unlinkSync(tempPptxPath);
    if (courseA?._id) {
      await Question.deleteMany({ courseId: courseA._id });
      await MaterialChunk.deleteMany({ courseId: courseA._id });
      await CourseMaterial.deleteMany({ courseId: courseA._id });
      await Course.deleteMany({ _id: courseA._id });
    }
    if (instructorA?._id || studentA?._id) {
      await User.deleteMany({ _id: { $in: [instructorA?._id, studentA?._id].filter(Boolean) } });
    }
    if (instA?._id) {
      await Institution.deleteMany({ _id: instA._id });
    }
  });

  it('1. POST /api/v1/courses/:courseId/ai/materials/:materialId/process - Instructor processes PDF material with real vector embeddings', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/materials/${materialA.id || materialA._id}/process`)
      .set('Authorization', `Bearer ${instructorAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processingStatus).toBe('PROCESSED');
    expect(res.body.data.chunkCount).toBeGreaterThan(0);

    const chunks = await MaterialChunk.find({ materialId: materialA.id || materialA._id });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].embedding.length).toBe(768); // Real 768-dim vector embedding persisted
    expect(chunks[0].embeddingDimensions).toBe(768);
  });

  it('2. POST /api/v1/courses/:courseId/ai/materials/:materialId/process - Instructor processes PPTX presentation with XML slide text extraction', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/materials/${pptxMaterial.id || pptxMaterial._id}/process`)
      .set('Authorization', `Bearer ${instructorAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processingStatus).toBe('PROCESSED');

    const chunks = await MaterialChunk.find({ materialId: pptxMaterial.id || pptxMaterial._id });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toContain('[Slide 1]');
    expect(chunks[0].embedding.length).toBe(768);
  });

  it('3. POST /api/v1/courses/:courseId/ai/generate-questions - Instructor triggers RAG question generation using vector retrieval', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/generate-questions`)
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        materialIds: [materialA.id || materialA._id],
        topic: 'Process Scheduling',
        difficulty: 'MEDIUM',
        questionTypes: ['MCQ'],
        numberOfQuestions: 2,
      });

    if (res.status !== 201) {
      console.error('Test 3 API Error:', res.status, res.body);
    }
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);

    const generatedQuestion = res.body.data[0];
    expect(generatedQuestion.status).toBe('DRAFT'); // Always DRAFT until explicitly approved
    expect(generatedQuestion.generationSource).toBe('AI_RAG');
    expect(generatedQuestion.sourceReferences.length).toBeGreaterThan(0);
  });

  it('4. GET /api/v1/courses/:courseId/ai/questions - Instructor lists course questions', async () => {
    const res = await request(app)
      .get(`/api/v1/courses/${courseA._id}/ai/questions?status=DRAFT`)
      .set('Authorization', `Bearer ${instructorAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('5. PATCH /api/v1/ai/questions/:id - Instructor edits a question', async () => {
    const draftQuestions = await Question.find({ courseId: courseA._id, status: 'DRAFT' });
    const questionToEdit = draftQuestions[0];

    const res = await request(app)
      .patch(`/api/v1/ai/questions/${questionToEdit._id}`)
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        questionText: 'Edited: What mode do OS processes run in?',
        difficulty: 'HARD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questionText).toBe('Edited: What mode do OS processes run in?');
    expect(res.body.data.difficulty).toBe('HARD');
  });

  it('6. PATCH /api/v1/ai/questions/:id/approve - Instructor approves question for Question Bank', async () => {
    const draftQuestions = await Question.find({ courseId: courseA._id, status: 'DRAFT' });
    const questionToApprove = draftQuestions[0];

    const res = await request(app)
      .patch(`/api/v1/ai/questions/${questionToApprove._id}/approve`)
      .set('Authorization', `Bearer ${instructorAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('7. Student RBAC Denial: Student cannot process material or generate questions', async () => {
    const processRes = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/materials/${materialA.id || materialA._id}/process`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(processRes.status).toBe(403);

    const generateRes = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/generate-questions`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ numberOfQuestions: 2 });
    expect(generateRes.status).toBe(403);
  });

  it('8. Admin RBAC Denial: Admin cannot process material, generate questions, or approve questions', async () => {
    const adminUser = await User.create({
      name: 'Admin User Test',
      email: `admin_ai_test_${Date.now()}@example.com`,
      passwordHash: 'hashedpass',
      role: 'INSTITUTION_ADMIN',
      institutionId: instA._id,
    });
    const adminToken = generateAccessToken({ userId: adminUser._id, role: adminUser.role, institutionId: instA._id });

    const processRes = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/materials/${materialA.id || materialA._id}/process`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(processRes.status).toBe(403);

    const generateRes = await request(app)
      .post(`/api/v1/courses/${courseA._id}/ai/generate-questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ numberOfQuestions: 2 });
    expect(generateRes.status).toBe(403);

    await User.deleteMany({ _id: adminUser._id });
  });
});
