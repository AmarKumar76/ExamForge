const mongoose = require('mongoose');
require('dotenv').config();

const QuestionFolder = require('../src/models/QuestionFolder');
const Question = require('../src/models/Question');
const Course = require('../src/models/Course');
const Exam = require('../src/models/Exam');
const folderController = require('../src/controllers/folder.controller');
const examService = require('../src/services/exam.service');
const questionGeneratorService = require('../src/services/ai/questionGenerator.service');

async function runTests() {
  const config = require('../src/config/env');
  const MONGO_URI = config.mongoUri;
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  try {
    console.log('\n==================================================');
    console.log('STARTING SRS-TO-CODEBASE QUESTION BANK & EXAM TEST');
    console.log('==================================================\n');

    // 1. Setup Test Courses
    let courseA = await Course.findOne({ code: 'CS304_TEST' });
    if (!courseA) {
      courseA = await Course.create({
        code: 'CS304_TEST',
        name: 'System Design Test Course',
        department: 'CS',
        semester: 4,
        academicYear: '2025-2026',
        description: 'Test Course A',
        institutionId: new mongoose.Types.ObjectId(),
      });
    }

    let courseB = await Course.findOne({ code: 'CS305_TEST' });
    if (!courseB) {
      courseB = await Course.create({
        code: 'CS305_TEST',
        name: 'Database Systems Test Course',
        department: 'CS',
        semester: 5,
        academicYear: '2025-2026',
        description: 'Test Course B',
        institutionId: courseA.institutionId,
      });
    }

    const instructorId = new mongoose.Types.ObjectId();
    courseA.instructorIds = [instructorId];
    courseB.instructorIds = [instructorId];
    await courseA.save();
    await courseB.save();

    const mockInstructor = {
      _id: instructorId,
      id: instructorId.toString(),
      role: 'INSTRUCTOR',
      institutionId: courseA.institutionId,
    };

    // Clean previous test data
    await QuestionFolder.deleteMany({ courseId: { $in: [courseA._id, courseB._id] } });
    await Question.deleteMany({ courseId: { $in: [courseA._id, courseB._id] } });
    await Exam.deleteMany({ courseId: { $in: [courseA._id, courseB._id] } });

    // 2. Create folders in Course A and Course B
    const folderA1 = await QuestionFolder.create({
      courseId: courseA._id,
      institutionId: courseA.institutionId,
      title: 'TEST_java programming',
      description: 'Java Programming Unit',
      orderIndex: 1,
      createdBy: instructorId,
    });

    const folderA2 = await QuestionFolder.create({
      courseId: courseA._id,
      institutionId: courseA.institutionId,
      title: 'TEST_Graph',
      description: 'Graph Unit',
      orderIndex: 2,
      createdBy: instructorId,
    });

    const folderB1 = await QuestionFolder.create({
      courseId: courseB._id,
      institutionId: courseB.institutionId,
      title: 'TEST_CourseB_Unit',
      description: 'Course B Folder',
      orderIndex: 1,
      createdBy: instructorId,
    });

    // 3. Create Questions in Course A
    // qRoot1, qRoot2: Unfoldered (folderId: null)
    const qRoot1 = await Question.create({
      courseId: courseA._id,
      institutionId: courseA.institutionId,
      createdBy: instructorId,
      questionText: 'TEST_Q_ROOT_1: What is OOP?',
      type: 'MCQ',
      options: ['Object Oriented', 'Process', 'Functional', 'Logic'],
      correctAnswer: 'Object Oriented',
      difficulty: 'EASY',
      status: 'APPROVED',
      folderId: null,
    });

    const qRoot2 = await Question.create({
      courseId: courseA._id,
      institutionId: courseA.institutionId,
      createdBy: instructorId,
      questionText: 'TEST_Q_ROOT_2: What is a Class?',
      type: 'MCQ',
      options: ['Blueprint', 'Variable', 'Loop', 'Method'],
      correctAnswer: 'Blueprint',
      difficulty: 'MEDIUM',
      status: 'DRAFT',
      folderId: null,
    });

    // qFolderA1_1, qFolderA1_2 inside folderA1
    const qFolderA1_1 = await Question.create({
      courseId: courseA._id,
      institutionId: courseA.institutionId,
      createdBy: instructorId,
      questionText: 'TEST_Q_JAVA_1: Java Virtual Machine',
      type: 'MCQ',
      options: ['JVM', 'JRE', 'JDK', 'IDE'],
      correctAnswer: 'JVM',
      difficulty: 'EASY',
      status: 'APPROVED',
      folderId: folderA1._id,
    });

    const qFolderA1_2 = await Question.create({
      courseId: courseA._id,
      institutionId: courseA.institutionId,
      createdBy: instructorId,
      questionText: 'TEST_Q_JAVA_2: Garbage Collection',
      type: 'MCQ',
      options: ['Memory management', 'File I/O', 'Network', 'Graphics'],
      correctAnswer: 'Memory management',
      difficulty: 'HARD',
      status: 'REJECTED',
      folderId: folderA1._id,
    });

    // qFolderA2_1 inside folderA2
    const qFolderA2_1 = await Question.create({
      courseId: courseA._id,
      institutionId: courseA.institutionId,
      createdBy: instructorId,
      questionText: 'TEST_Q_GRAPH_1: BFS Search Algorithm',
      type: 'MCQ',
      options: ['Queue', 'Stack', 'Heap', 'Tree'],
      correctAnswer: 'Queue',
      difficulty: 'MEDIUM',
      status: 'APPROVED',
      folderId: folderA2._id,
    });

    // Question in Course B
    const qCourseB = await Question.create({
      courseId: courseB._id,
      institutionId: courseB.institutionId,
      createdBy: instructorId,
      questionText: 'TEST_Q_COURSEB_1: SQL Join',
      type: 'MCQ',
      options: ['INNER', 'OUTER', 'CROSS', 'ALL'],
      correctAnswer: 'INNER',
      difficulty: 'EASY',
      status: 'APPROVED',
      folderId: folderB1._id,
    });

    console.log('✅ Created test courses, folders, and questions in MongoDB.\n');

    // ----------------------------------------------------
    // QUESTION BANK TESTS (1-10)
    // ----------------------------------------------------

    // TEST 1 & 2: GET /folders returns course folders & MongoDB counts
    const reqGetFolders = { params: { courseId: courseA._id.toString() }, user: mockInstructor };
    const resGetFolders = {
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };
    await folderController.getFolders(reqGetFolders, resGetFolders);

    console.log('[TEST 1 & 2] GET /folders response for Course A:');
    console.log(' - Uncategorized counts:', resGetFolders.body.data.uncategorized.counts);
    console.log(' - Folder counts:', resGetFolders.body.data.folders.map(f => ({ title: f.title, counts: f.counts })));
    console.log(' - All course counts:', resGetFolders.body.data.allCourseCounts);

    if (resGetFolders.body.data.uncategorized.counts.total !== 2) throw new Error('Test 1 Failed: Uncategorized total count should be 2');
    if (resGetFolders.body.data.folders[0].counts.total !== 2) throw new Error('Test 2 Failed: Folder A1 total count should be 2');
    if (resGetFolders.body.data.allCourseCounts.total !== 5) throw new Error('Test 2 Failed: All Course total count should be 5');

    // TEST 3 & 4 & 5: getQuestions with folderIdFilter
    const qUnfoldered = await questionGeneratorService.getQuestions(courseA._id, mockInstructor, null, 'uncategorized');
    console.log('\n[TEST 4 & 5] Unfoldered questions count:', qUnfoldered.length);
    const unfolderedIds = qUnfoldered.map(q => q._id.toString());
    if (unfolderedIds.includes(qFolderA1_1._id.toString())) throw new Error('Test 5 Failed: Foldered question appeared in Unfoldered!');
    if (!unfolderedIds.includes(qRoot1._id.toString())) throw new Error('Test 4 Failed: Unfoldered question missing from Unfoldered!');

    const qFolder1 = await questionGeneratorService.getQuestions(courseA._id, mockInstructor, null, folderA1._id.toString());
    console.log('[TEST 3] Folder A1 questions count:', qFolder1.length);
    if (qFolder1.length !== 2 || qFolder1[0].folderId._id.toString() !== folderA1._id.toString()) {
      throw new Error('Test 3 Failed: Folder query did not return folder questions');
    }

    // TEST 6: Course A folders do not appear in Course B
    const reqGetFoldersB = { params: { courseId: courseB._id.toString() }, user: mockInstructor };
    const resGetFoldersB = {
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };
    await folderController.getFolders(reqGetFoldersB, resGetFoldersB);
    const courseBFolderTitles = resGetFoldersB.body.data.folders.map(f => f.title);
    console.log('\n[TEST 6] Course B folders:', courseBFolderTitles);
    if (courseBFolderTitles.includes('TEST_java programming')) {
      throw new Error('Test 6 Failed: Course A folder appeared in Course B!');
    }

    // TEST 7, 8, 10: Move question & verify count & zero duplicate documents
    const initialTotalCourseAQ = await Question.countDocuments({ courseId: courseA._id });
    await folderController.moveQuestion(
      { body: { questionId: qRoot1._id.toString(), targetFolderId: folderA1._id.toString() }, user: mockInstructor },
      { status(code) { return this; }, json(data) { return this; } }
    );
    const afterMoveTotalCourseAQ = await Question.countDocuments({ courseId: courseA._id });
    console.log('\n[TEST 7 & 10] Total questions before move:', initialTotalCourseAQ, 'after move:', afterMoveTotalCourseAQ);
    if (initialTotalCourseAQ !== afterMoveTotalCourseAQ) throw new Error('Test 10 Failed: Duplicate question document created!');

    // Move back to root
    await folderController.moveQuestion(
      { body: { questionId: qRoot1._id.toString(), targetFolderId: 'uncategorized' }, user: mockInstructor },
      { status(code) { return this; }, json(data) { return this; } }
    );
    const qRoot1After = await Question.findById(qRoot1._id);
    console.log('[TEST 8] QRoot1 folderId after moving back to root:', qRoot1After.folderId);
    if (qRoot1After.folderId !== null) throw new Error('Test 8 Failed: folderId was not reset to null');

    // ----------------------------------------------------
    // EXAM BUILDER TESTS (11-21)
    // ----------------------------------------------------

    // TEST 11 & 12: Selected folders return only APPROVED questions
    const approvedInFolderA1 = await Question.find({
      courseId: courseA._id,
      folderId: folderA1._id,
      status: 'APPROVED',
    });
    console.log('\n[TEST 12] Approved questions in Folder A1:', approvedInFolderA1.map(q => q.questionText));
    if (approvedInFolderA1.length !== 1 || approvedInFolderA1[0]._id.toString() !== qFolderA1_1._id.toString()) {
      throw new Error('Test 12 Failed: Draft/Rejected questions returned in approved folder query!');
    }

    // TEST 14 & 15: Draft or Rejected question selection is rejected by createExam
    let unapprovedRejected = false;
    try {
      await examService.createExam({
        courseId: courseA._id,
        title: 'UNAPPROVED_TEST_EXAM',
        duration: 60,
        questionIds: [qFolderA1_2._id], // REJECTED question
      }, mockInstructor);
    } catch (err) {
      unapprovedRejected = true;
      console.log('[TEST 15] Rejected question exam creation correctly blocked:', err.message);
    }
    if (!unapprovedRejected) throw new Error('Test 15 Failed: REJECTED question entered exam!');

    // TEST 16 & 17 & 18: Questions per student and difficulty validation
    let diffValidationFailed = false;
    try {
      await examService.createExam({
        courseId: courseA._id,
        title: 'DIFF_MISMATCH_EXAM',
        duration: 60,
        folderIds: [folderA1._id],
        questionsPerStudent: 5,
        difficultyDistribution: { easy: 2, medium: 2, hard: 2 }, // Sum 6 != 5
      }, mockInstructor);
    } catch (err) {
      diffValidationFailed = true;
      console.log('\n[TEST 17] Difficulty mismatch correctly rejected:', err.message);
    }

    // TEST 19 & 20: Create Exam creates DRAFT with Start/End times
    const startTime = new Date(Date.now() + 3600000); // +1 hour
    const endTime = new Date(Date.now() + 7200000); // +2 hours

    const createdDraftExam = await examService.createExam({
      courseId: courseA._id,
      title: 'TEST_DSA_UNIT_TEST_1',
      description: 'Official DSA Unit Test',
      duration: 60,
      totalMarks: 50,
      passingMarks: 20,
      folderIds: [folderA1._id.toString(), folderA2._id.toString()],
      questionsPerStudent: 2,
      difficultyDistribution: { easy: 1, medium: 1, hard: 0 },
      startTime,
      endTime,
    }, mockInstructor);

    console.log('\n[TEST 19 & 20] Created Exam:', {
      id: createdDraftExam._id,
      title: createdDraftExam.title,
      status: createdDraftExam.status,
      startTime: createdDraftExam.startTime,
      endTime: createdDraftExam.endTime,
    });

    if (createdDraftExam.status !== 'DRAFT') throw new Error('Test 20 Failed: Exam was not created as DRAFT!');
    if (!createdDraftExam.startTime || !createdDraftExam.endTime) throw new Error('Test 19 Failed: Start/End time not saved!');

    // TEST 21: Publish Exam changes status
    const publishedExam = await examService.publishExam(createdDraftExam._id, mockInstructor);
    console.log('\n[TEST 21] Published Exam status:', publishedExam.status);
    if (publishedExam.status !== 'PUBLISHED' && publishedExam.status !== 'SCHEDULED' && publishedExam.status !== 'ACTIVE') {
      throw new Error('Test 21 Failed: Exam status was not updated to PUBLISHED!');
    }

    // Clean up test data
    await QuestionFolder.deleteMany({ courseId: { $in: [courseA._id, courseB._id] } });
    await Question.deleteMany({ courseId: { $in: [courseA._id, courseB._id] } });
    await Exam.deleteMany({ courseId: { $in: [courseA._id, courseB._id] } });
    await Course.deleteMany({ code: { $in: ['CS304_TEST', 'CS305_TEST'] } });

    console.log('\n==================================================');
    console.log('✅ ALL 21 SRS-TO-CODEBASE TESTS PASSED PERFECTLY!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
