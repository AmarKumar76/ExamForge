const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const MaterialChunk = require('../models/MaterialChunk');
const QuestionFolder = require('../models/QuestionFolder');
const Question = require('../models/Question');
const User = require('../models/User');
const questionGeneratorService = require('../services/ai/questionGenerator.service');
const retrieverService = require('../services/ai/retriever.service');
const geminiService = require('../services/ai/gemini.service');
const examService = require('../services/exam.service');

async function testChapterWorkflow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const course = await Course.findOne({ code: 'CS301' }) || await Course.findOne();
    if (!course) {
      console.error('No course found in DB');
      process.exit(1);
    }
    console.log(`Testing with course: ${course.code} - ${course.name} (ID: ${course._id})`);

    const instructor = await User.findOne({ role: 'INSTRUCTOR', institutionId: course.institutionId }) ||
                       await User.findOne({ role: 'INSTRUCTOR' });
    if (!instructor) {
      console.error('No instructor found');
      process.exit(1);
    }
    console.log(`Instructor: ${instructor.name} (${instructor.email})`);

    // Ensure instructor is assigned to course
    if (!course.instructorIds.some(id => id.toString() === instructor._id.toString())) {
      course.instructorIds.push(instructor._id);
      await course.save();
    }

    // Ensure dummy material & chunk exist for RAG retrieval
    let mat = await CourseMaterial.findOne({ courseId: course._id });
    if (!mat) {
      mat = await CourseMaterial.create({
        courseId: course._id,
        institutionId: course.institutionId,
        title: 'Unit 1 - Introduction to Algorithms',
        fileName: 'unit1_intro.pdf',
        originalFileName: 'Unit 1 - Introduction to Algorithms.pdf',
        fileType: 'PDF',
        mimeType: 'application/pdf',
        fileSize: 1024,
        fileKey: 'materials/unit1_intro.pdf',
        uploadedBy: instructor._id,
        status: 'READY',
        processingStatus: 'PROCESSED',
      });
    }

    let chunk = await MaterialChunk.findOne({ materialId: mat._id });
    if (!chunk) {
      chunk = await MaterialChunk.create({
        materialId: mat._id,
        courseId: course._id,
        institutionId: course.institutionId,
        chunkIndex: 0,
        text: 'An algorithm is a finite sequence of well-defined instructions used to solve a computational problem. Asymptotic analysis evaluates the efficiency of an algorithm.',
        tokenCount: 25,
        sourceFileName: mat.originalFileName,
      });
    }

    // Mock retrieverService and geminiService for fast deterministic offline execution
    retrieverService.retrieveRelevantChunks = async () => [
      {
        chunkId: chunk._id,
        materialId: mat._id,
        text: chunk.text,
        pageNumber: 1,
        sourceFileName: mat.originalFileName,
        similarityScore: 0.95,
      }
    ];

    let mockQCount = 1;
    geminiService.generateQuestions = async (context, cfg) => {
      const qList = [];
      const num = cfg.numberOfQuestions || 2;
      for (let i = 0; i < num; i++) {
        qList.push({
          type: 'MCQ',
          questionText: `What is a primary characteristic of a well-defined algorithm? (Sample ${mockQCount++})`,
          options: ['Finiteness and unambiguous steps', 'Infinite execution', 'Hardware dependence', 'None of the above'],
          correctAnswer: 'Finiteness and unambiguous steps',
          explanation: 'Algorithms must have unambiguous steps and terminate after a finite number of operations.',
          difficulty: cfg.difficulty || 'MEDIUM',
          topic: cfg.topic || 'Algorithms',
        });
      }
      return qList;
    };

    // TEST 1: Automatic Folder Creation for Chapter 1
    console.log('\n--- TEST 1: Automatic Folder Creation for Chapter 1 ---');
    const chap1Name = 'Introduction and Analysis of Algorithms';
    await QuestionFolder.deleteMany({ courseId: course._id, title: chap1Name });

    const qBatch1 = await questionGeneratorService.generateDraftQuestions({
      courseId: course._id,
      chapterName: chap1Name,
      numberOfQuestions: 2,
      user: instructor,
    });

    console.log(`Generated ${qBatch1.length} questions for Chapter 1.`);
    const folder1 = await QuestionFolder.findOne({ courseId: course._id, title: chap1Name });
    console.log(`Folder 1 ID: ${folder1?._id}, Title: "${folder1?.title}"`);
    if (!folder1) throw new Error('Chapter 1 folder was not automatically created!');

    // TEST 2: Generate more questions for Chapter 1 (Reuse existing folder)
    console.log('\n--- TEST 2: Reuse Existing Chapter 1 Folder ---');
    const folderCountBefore = await QuestionFolder.countDocuments({ courseId: course._id, title: chap1Name });

    const qBatch2 = await questionGeneratorService.generateDraftQuestions({
      courseId: course._id,
      chapterName: chap1Name,
      numberOfQuestions: 2,
      user: instructor,
    });

    const folderCountAfter = await QuestionFolder.countDocuments({ courseId: course._id, title: chap1Name });
    console.log(`Folder count for "${chap1Name}" before=${folderCountBefore}, after=${folderCountAfter}`);
    if (folderCountAfter !== 1) throw new Error('Duplicate folder created for same chapter!');

    qBatch2.forEach(q => {
      if (q.folderId.toString() !== folder1._id.toString()) {
        throw new Error(`Question folderId (${q.folderId}) does not match folder1 ID (${folder1._id})`);
      }
    });
    console.log('All Chapter 1 questions correctly linked to same folderId.');

    // TEST 3: Automatic Folder Creation for Chapter 2
    console.log('\n--- TEST 3: Automatic Folder Creation for Chapter 2 ---');
    const chap2Name = 'Asymptotic Analysis';
    await QuestionFolder.deleteMany({ courseId: course._id, title: chap2Name });

    const qBatch3 = await questionGeneratorService.generateDraftQuestions({
      courseId: course._id,
      chapterName: chap2Name,
      numberOfQuestions: 2,
      user: instructor,
    });

    const folder2 = await QuestionFolder.findOne({ courseId: course._id, title: chap2Name });
    console.log(`Folder 2 ID: ${folder2?._id}, Title: "${folder2?.title}"`);
    if (!folder2) throw new Error('Chapter 2 folder was not automatically created!');

    // TEST 4: Approve questions for Chapter 1 and Chapter 2
    console.log('\n--- TEST 4: Approving Questions for Exams ---');
    await questionGeneratorService.bulkApproveQuestions(
      [...qBatch1, ...qBatch2, ...qBatch3].map(q => q._id),
      instructor
    );
    console.log('Questions approved.');

    // TEST 5: Chapter-wise Exam Creation (Chapter 1 Only)
    console.log('\n--- TEST 5: Chapter 1 Only Exam Creation ---');
    const chap1Exam = await examService.createExam({
      courseId: course._id,
      title: 'Chapter 1 Midterm Quiz',
      duration: 30,
      totalMarks: 50,
      passingMarks: 20,
      folderIds: [folder1._id.toString()],
    }, instructor);

    console.log(`Created Exam ID: ${chap1Exam._id}, Title: "${chap1Exam.title}"`);
    console.log(`Questions in Exam: ${chap1Exam.questionIds.length}`);
    chap1Exam.questionIds.forEach(q => {
      if (q.folderId.toString() !== folder1._id.toString()) {
        throw new Error(`Chapter 1 Exam contains question from another folder: ${q.folderId}`);
      }
    });
    console.log('Chapter 1 Exam contains ONLY approved questions from Chapter 1!');

    // TEST 6: Multi-chapter / Syllabus Exam Creation
    console.log('\n--- TEST 6: Multi-Chapter (Chapter 1 + Chapter 2) Exam Creation ---');
    const syllabusExam = await examService.createExam({
      courseId: course._id,
      title: 'Syllabus Final Examination',
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      folderIds: [folder1._id.toString(), folder2._id.toString()],
    }, instructor);

    console.log(`Created Multi-Chapter Exam ID: ${syllabusExam._id}, Title: "${syllabusExam.title}"`);
    console.log(`Questions in Multi-Chapter Exam: ${syllabusExam.questionIds.length}`);
    const uniqueFoldersInExam = [...new Set(syllabusExam.questionIds.map(q => q.folderId.toString()))];
    console.log(`Unique chapter folders in Exam pool: ${uniqueFoldersInExam.length}`);
    if (uniqueFoldersInExam.length < 2) throw new Error('Multi-chapter exam did not combine questions from both chapters!');

    console.log('\n🎉 ALL END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY!');

  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testChapterWorkflow();
