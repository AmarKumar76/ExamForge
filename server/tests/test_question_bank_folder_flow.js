const mongoose = require('mongoose');
require('dotenv').config();

const QuestionFolder = require('../src/models/QuestionFolder');
const Question = require('../src/models/Question');
const Course = require('../src/models/Course');
const folderController = require('../src/controllers/folder.controller');

async function runTest() {
  const config = require('../src/config/env');
  const MONGO_URI = config.mongoUri;
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  try {
    console.log('\n--- STARTING QUESTION BANK FOLDER FLOW INTEGRATION TEST ---');

    // 1. Find or create a test course
    let course = await Course.findOne();
    if (!course) {
      course = await Course.create({
        code: 'CS101',
        name: 'Introduction to Computer Science',
        department: 'CS',
        semester: 1,
        academicYear: '2025-2026',
        description: 'Test Course',
      });
      console.log('Created test course:', course._id);
    } else {
      console.log('Using existing course:', course.code, '(', course._id, ')');
    }

    // Create a dummy second course to test cross-course isolation
    let course2 = await Course.findOne({ code: 'CS102' });
    if (!course2) {
      course2 = await Course.create({
        code: 'CS102',
        name: 'Data Structures',
        department: 'CS',
        semester: 2,
        academicYear: '2025-2026',
        description: 'Test Course 2',
        institutionId: course.institutionId || new mongoose.Types.ObjectId(),
      });
      console.log('Created second test course:', course2._id);
    }

    // 2. Clean up any existing test folders and test questions for this test
    await QuestionFolder.deleteMany({ title: { $regex: /^TEST_FOLDER_/ } });
    await Question.deleteMany({ questionText: { $regex: /^TEST_QUESTION_/ } });

    const dummyUserId = course.createdBy || new mongoose.Types.ObjectId();
    const instId = course.institutionId || new mongoose.Types.ObjectId();

    // 3. Create 3 test questions in course (folderId: null)
    const q1 = await Question.create({
      courseId: course._id,
      institutionId: instId,
      createdBy: dummyUserId,
      questionText: 'TEST_QUESTION_1: What is O(1)?',
      type: 'MCQ',
      options: ['Constant time', 'Linear time', 'Logarithmic time', 'Quadratic time'],
      correctAnswer: 'Constant time',
      explanation: 'O(1) signifies constant time complexity.',
      difficulty: 'EASY',
      status: 'APPROVED',
      folderId: null,
    });

    const q2 = await Question.create({
      courseId: course._id,
      institutionId: instId,
      createdBy: dummyUserId,
      questionText: 'TEST_QUESTION_2: What is O(n)?',
      type: 'MCQ',
      options: ['Constant time', 'Linear time', 'Logarithmic time', 'Quadratic time'],
      correctAnswer: 'Linear time',
      explanation: 'O(n) signifies linear time complexity.',
      difficulty: 'MEDIUM',
      status: 'APPROVED',
      folderId: null,
    });

    const q3 = await Question.create({
      courseId: course._id,
      institutionId: instId,
      createdBy: dummyUserId,
      questionText: 'TEST_QUESTION_3: What is O(n^2)?',
      type: 'MCQ',
      options: ['Constant time', 'Linear time', 'Logarithmic time', 'Quadratic time'],
      correctAnswer: 'Quadratic time',
      explanation: 'O(n^2) signifies quadratic time complexity.',
      difficulty: 'HARD',
      status: 'DRAFT',
      folderId: null,
    });

    console.log('Created 3 test questions in course 1 with folderId: null.');
    console.log('Q1 ID:', q1._id);
    console.log('Q2 ID:', q2._id);
    console.log('Q3 ID:', q3._id);

    // Initial check: total count in collection before moves
    const initialTotalQuestions = await Question.countDocuments({ courseId: course._id });

    // 4. Test API GET /folders (uncategorized count should be at least 3)
    const mockReqGet = { params: { courseId: course._id.toString() } };
    const mockResGet = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await folderController.getFolders(mockReqGet, mockResGet);
    console.log('\n[TEST 1] GET /folders response uncategorized count:', mockResGet.body.data.uncategorized.counts);
    if (mockResGet.body.data.uncategorized.counts.total < 3) {
      throw new Error('Uncategorized count failed to reflect initial root questions');
    }

    // 5. Test createFolder with questionIds: [q1._id, q2._id]
    const mockReqCreate = {
      params: { courseId: course._id.toString() },
      body: {
        title: 'TEST_FOLDER_UNIT_1',
        description: 'Unit 1 folder test',
        questionIds: [q1._id.toString(), q2._id.toString()],
      },
      user: { id: course.createdBy || new mongoose.Types.ObjectId(), role: 'ADMIN' },
    };
    const mockResCreate = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await folderController.createFolder(mockReqCreate, mockResCreate);
    console.log('\n[TEST 2] createFolder response:', mockResCreate.body);

    const createdFolderId = mockResCreate.body.data._id || mockResCreate.body.data.id;
    if (!createdFolderId) throw new Error('Folder creation failed, no _id or id returned');

    // Verify q1 and q2 folderId updated in MongoDB
    const updatedQ1 = await Question.findById(q1._id);
    const updatedQ2 = await Question.findById(q2._id);
    const updatedQ3 = await Question.findById(q3._id);

    console.log('Updated Q1 folderId:', updatedQ1.folderId);
    console.log('Updated Q2 folderId:', updatedQ2.folderId);
    console.log('Updated Q3 folderId:', updatedQ3.folderId);

    if (updatedQ1.folderId.toString() !== createdFolderId.toString()) {
      throw new Error('Q1 folderId was not updated to new folder ID');
    }
    if (updatedQ2.folderId.toString() !== createdFolderId.toString()) {
      throw new Error('Q2 folderId was not updated to new folder ID');
    }
    if (updatedQ3.folderId !== null) {
      throw new Error('Q3 folderId should remain null');
    }

    // Verify total question count remains EXACTLY unchanged (no duplicates created)
    const afterCreateTotalQuestions = await Question.countDocuments({ courseId: course._id });
    console.log(`Total questions in course before move: ${initialTotalQuestions}, after move: ${afterCreateTotalQuestions}`);
    if (initialTotalQuestions !== afterCreateTotalQuestions) {
      throw new Error('Duplicate question documents were created!');
    }

    // 6. Test moving question back to Root (folderId: null)
    const mockReqMoveRoot = {
      body: {
        questionId: q1._id.toString(),
        targetFolderId: 'uncategorized',
      },
      user: { id: course.createdBy || new mongoose.Types.ObjectId(), role: 'ADMIN' },
    };
    const mockResMoveRoot = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await folderController.moveQuestion(mockReqMoveRoot, mockResMoveRoot);
    console.log('\n[TEST 3] Move Q1 back to Root response:', mockResMoveRoot.body.message);

    const q1AfterMoveRoot = await Question.findById(q1._id);
    if (q1AfterMoveRoot.folderId !== null) {
      throw new Error('Q1 folderId should be null after move to uncategorized/root');
    }

    // 7. Test bulk move back to folder
    const mockReqBulkMove = {
      body: {
        questionIds: [q1._id.toString(), q3._id.toString()],
        targetFolderId: createdFolderId.toString(),
      },
      user: { id: course.createdBy || new mongoose.Types.ObjectId(), role: 'ADMIN' },
    };
    const mockResBulkMove = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await folderController.bulkMoveQuestions(mockReqBulkMove, mockResBulkMove);
    console.log('\n[TEST 4] Bulk Move [Q1, Q3] to folder response:', mockResBulkMove.body);

    const q1InFolder = await Question.findById(q1._id);
    const q3InFolder = await Question.findById(q3._id);

    if (q1InFolder.folderId.toString() !== createdFolderId.toString()) throw new Error('Q1 failed to move to folder');
    if (q3InFolder.folderId.toString() !== createdFolderId.toString()) throw new Error('Q3 failed to move to folder');

    // 8. Test cross-course move prevention
    const folderCourse2 = await QuestionFolder.create({
      courseId: course2._id,
      institutionId: course2.institutionId || new mongoose.Types.ObjectId(),
      createdBy: dummyUserId,
      title: 'TEST_FOLDER_COURSE2',
      description: 'Folder in Course 2',
    });

    const mockReqCrossCourse = {
      body: {
        questionId: q1._id.toString(),
        targetFolderId: folderCourse2._id.toString(),
      },
      user: { id: course.createdBy || new mongoose.Types.ObjectId(), role: 'ADMIN' },
    };
    let crossCourseFailed = false;
    try {
      await folderController.moveQuestion(mockReqCrossCourse, {
        status(code) { return this; },
        json(data) { return this; },
      });
    } catch (err) {
      crossCourseFailed = true;
      console.log('\n[TEST 5] Cross-course move correctly rejected with error:', err.message);
    }
    if (!crossCourseFailed) {
      throw new Error('Cross-course move was NOT rejected!');
    }

    // 9. Test Exam Builder query for approved questions in selected folders
    // Approved questions in createdFolderId should be q1 and q2 (q3 is DRAFT)
    const examBuilderFolderQuestions = await Question.find({
      courseId: course._id,
      folderId: { $in: [createdFolderId] },
      status: 'APPROVED',
    });

    console.log('\n[TEST 6] Exam Builder query for folder:', createdFolderId.toString());
    console.log('Found approved questions:', examBuilderFolderQuestions.map(q => q.questionText));

    const approvedIds = examBuilderFolderQuestions.map(q => q._id.toString());
    if (!approvedIds.includes(q1._id.toString()) || !approvedIds.includes(q2._id.toString())) {
      throw new Error('Exam Builder folder query failed to return approved questions');
    }
    if (approvedIds.includes(q3._id.toString())) {
      throw new Error('Exam Builder folder query returned DRAFT question');
    }

    // Clean up test data
    await QuestionFolder.deleteMany({ title: { $regex: /^TEST_FOLDER_/ } });
    await Question.deleteMany({ questionText: { $regex: /^TEST_QUESTION_/ } });

    console.log('\n✅ ALL INTEGRATION TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ INTEGRATION TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
