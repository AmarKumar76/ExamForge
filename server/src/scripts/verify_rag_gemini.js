require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const MaterialChunk = require('../models/MaterialChunk');
const Question = require('../models/Question');
const questionGeneratorService = require('../services/ai/questionGenerator.service');
const bcrypt = require('bcryptjs');

async function runVerification() {
  console.log('=== STARTING REAL RAG → GEMINI → MONGODB PIPELINE VERIFICATION ===');
  console.log('Using GEMINI_GENERATION_MODEL:', process.env.GEMINI_GENERATION_MODEL);

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in server/.env');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  try {
    // 1. Setup Institution
    let inst = await Institution.findOne({ code: 'VERIFY_INST' });
    if (!inst) {
      inst = await Institution.create({
        name: 'Verification Institute',
        code: 'VERIFY_INST',
      });
    }

    // 2. Setup Instructor
    const passHash = await bcrypt.hash('Instructor123!', 10);
    let instructor = await User.findOne({ email: 'verify_instructor@examforge.test' });
    if (!instructor) {
      instructor = await User.create({
        name: 'Dr. Gemini Verifier',
        email: 'verify_instructor@examforge.test',
        passwordHash: passHash,
        role: 'INSTRUCTOR',
        institutionId: inst._id,
      });
    }

    // 3. Setup Course CS301
    let course = await Course.findOne({ code: 'CS301', institutionId: inst._id });
    if (!course) {
      course = await Course.create({
        name: 'Data Structures & Algorithms',
        code: 'CS301',
        institutionId: inst._id,
        instructorIds: [instructor._id],
      });
    } else if (!course.instructorIds.some(id => id.toString() === instructor._id.toString())) {
      course.instructorIds.push(instructor._id);
      await course.save();
    }

    // 4. Setup Course Material & Chunks
    let material = await CourseMaterial.findOne({ courseId: course._id, originalFileName: 'CS301_Module1.pdf' });
    if (!material) {
      material = await CourseMaterial.create({
        courseId: course._id,
        institutionId: inst._id,
        uploadedBy: instructor._id,
        title: 'Module 1 - Tree & Graph Data Structures',
        fileName: 'CS301_Module1.pdf',
        originalFileName: 'CS301_Module1.pdf',
        fileKey: 'materials/CS301_Module1.pdf',
        fileType: 'PDF',
        mimeType: 'application/pdf',
        fileSize: 1024,
        processingStatus: 'PROCESSED',
        chunkCount: 2,
      });
    }

    // Clean old chunks and insert test chunks
    await MaterialChunk.deleteMany({ materialId: material._id });
    const dummyEmbedding = new Array(768).fill(0.01);

    await MaterialChunk.insertMany([
      {
        materialId: material._id,
        courseId: course._id,
        institutionId: inst._id,
        chunkIndex: 0,
        text: 'Binary Search Trees (BST) allow logarithmic average time complexity O(log N) for search, insertion, and deletion operations when balanced. Self-balancing BSTs like AVL trees and Red-Black trees guarantee O(log N) worst-case performance by maintaining height balance.',
        tokenCount: 45,
        sourceFileName: 'CS301_Module1.pdf',
        topic: 'Trees',
        embedding: dummyEmbedding,
        embeddingDimensions: 768,
        embeddingProvider: 'local',
        embeddingModel: 'all-MiniLM-L6-v2-local',
      },
      {
        materialId: material._id,
        courseId: course._id,
        institutionId: inst._id,
        chunkIndex: 1,
        text: 'Graphs consist of vertices and edges. Dijkstra Algorithm finds the shortest path from a starting vertex to all other vertices in a weighted graph with non-negative edge weights using a priority queue in O((V + E) log V) time.',
        tokenCount: 48,
        sourceFileName: 'CS301_Module1.pdf',
        topic: 'Graphs',
        embedding: dummyEmbedding,
        embeddingDimensions: 768,
        embeddingProvider: 'local',
        embeddingModel: 'all-MiniLM-L6-v2-local',
      },
    ]);

    console.log('Material and chunks prepared for CS301.');

    // 5. Trigger REAL RAG Question Generation with Gemini
    console.log('Requesting 5 questions (2 Easy, 2 Medium, 1 Hard)...');

    const generatedDocs = await questionGeneratorService.generateDraftQuestions({
      courseId: course._id,
      materialIds: [material._id],
      topic: 'Trees and Graphs',
      numberOfQuestions: 5,
      difficultyDistribution: { easy: 2, medium: 2, hard: 1 },
      questionTypes: ['MCQ'],
      user: instructor,
    });

    console.log(`\nSUCCESS: Generated ${generatedDocs.length} real questions via Gemini API!`);

    // 6. Verify MongoDB DRAFT count and required fields
    const draftCount = await Question.countDocuments({
      courseId: course._id,
      status: 'DRAFT',
    });

    console.log(`MongoDB DRAFT Question Count for CS301: ${draftCount}`);

    const sampleDraft = await Question.findById(generatedDocs[0]._id);
    console.log('\nSample DRAFT Question details:');
    console.log({
      id: sampleDraft._id,
      questionText: sampleDraft.questionText,
      options: sampleDraft.options,
      correctAnswer: sampleDraft.correctAnswer,
      difficulty: sampleDraft.difficulty,
      status: sampleDraft.status,
      hasSourceMaterialIds: sampleDraft.sourceMaterialIds.length > 0,
      hasSourceChunkIds: sampleDraft.sourceChunkIds.length > 0,
      hasSourceReferences: sampleDraft.sourceReferences.length > 0,
    });

    if (!sampleDraft.sourceMaterialIds.length || !sampleDraft.sourceChunkIds.length || !sampleDraft.sourceReferences.length) {
      throw new Error('DRAFT question missing source provenance fields!');
    }

    // 7. Approve one question
    const approvedQ = await questionGeneratorService.approveQuestion(sampleDraft._id, instructor);
    console.log(`\nQuestion ${approvedQ._id} status after approval: ${approvedQ.status}`);

    const approvedCount = await Question.countDocuments({
      courseId: course._id,
      status: 'APPROVED',
    });
    console.log(`MongoDB APPROVED Question Count for CS301: ${approvedCount}`);

    if (approvedQ.status !== 'APPROVED') {
      throw new Error('Question approval failed!');
    }

    console.log('\n=== ALL PIPELINE VERIFICATION STEPS PASSED SUCCESSFULLY! ===');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
