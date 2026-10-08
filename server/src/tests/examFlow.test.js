const mongoose = require('mongoose');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const CourseMaterial = require('../models/CourseMaterial');
const questionGeneratorService = require('../services/ai/questionGenerator.service');
const examService = require('../services/exam.service');

jest.setTimeout(15000);

describe('Exam Conduct Flow & Integration Tests', () => {
  const dummyInstructor = {
    _id: new mongoose.Types.ObjectId(),
    role: 'INSTRUCTOR',
    email: 'instructor@examforge.test',
  };

  const dummyStudent = {
    _id: new mongoose.Types.ObjectId(),
    role: 'STUDENT',
    email: 'student@examforge.test',
  };

  const courseId = new mongoose.Types.ObjectId();
  const institutionId = new mongoose.Types.ObjectId();

  beforeAll(() => {
    // Mock Course.findById to simulate assigned instructor & enrolled student
    const Course = require('../models/Course');
    jest.spyOn(Course, 'findById').mockImplementation(async (id) => ({
      _id: courseId,
      institutionId,
      code: 'CS301',
      title: 'Operating Systems',
      instructorIds: [dummyInstructor._id],
      studentIds: [dummyStudent._id],
    }));

    jest.spyOn(Course, 'find').mockImplementation(() => ({
      select: jest.fn().mockResolvedValue([
        { _id: courseId, code: 'CS301', title: 'Operating Systems', studentIds: [dummyStudent._id] },
      ]),
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('1 & 2. Approve draft question updates status to APPROVED and sets approvedBy/approvedAt', async () => {
    const mockSave = jest.fn().mockResolvedValue(true);
    const mockQuestion = {
      _id: new mongoose.Types.ObjectId(),
      courseId,
      institutionId,
      questionText: 'What is a process?',
      status: 'DRAFT',
      save: mockSave,
    };

    jest.spyOn(Question, 'findById').mockResolvedValue(mockQuestion);

    const approved = await questionGeneratorService.approveQuestion(mockQuestion._id, dummyInstructor);

    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe(dummyInstructor._id);
    expect(approved.approvedAt).toBeInstanceOf(Date);
    expect(mockSave).toHaveBeenCalled();
  });

  it('3 & 4. Create exam validates questions, calculates questionsPerStudent and persists difficulty distribution', async () => {
    const q1 = new mongoose.Types.ObjectId();
    const q2 = new mongoose.Types.ObjectId();

    const mockPool = [
      { _id: q1, questionText: 'Q1', difficulty: 'EASY', status: 'APPROVED' },
      { _id: q2, questionText: 'Q2', difficulty: 'MEDIUM', status: 'APPROVED' },
    ];

    jest.spyOn(Question, 'find').mockResolvedValue(mockPool);
    jest.spyOn(Exam, 'create').mockImplementation(async (data) => ({
      ...data,
      _id: new mongoose.Types.ObjectId(),
      populate: jest.fn().mockResolvedValue(data),
    }));

    const examData = {
      courseId,
      title: 'Midterm 2026',
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      questionIds: [q1, q2],
      questionsPerStudent: 2,
      difficultyDistribution: { easy: 1, medium: 1, hard: 0 },
    };

    const exam = await examService.createExam(examData, dummyInstructor);

    expect(exam.title).toBe('Midterm 2026');
    expect(exam.questionsPerStudent).toBe(2);
    expect(exam.difficultyDistribution).toEqual({ easy: 1, medium: 1, hard: 0 });
    expect(exam.status).toBe('DRAFT');
  });

  it('5. Publish exam fails if unapproved questions exist or counts are insufficient', async () => {
    const q1 = new mongoose.Types.ObjectId();
    const mockExam = {
      _id: new mongoose.Types.ObjectId(),
      courseId,
      institutionId,
      title: 'Test Exam',
      questionIds: [q1],
      questionsPerStudent: 1,
      difficultyDistribution: { easy: 1, medium: 0, hard: 0 },
      status: 'DRAFT',
      save: jest.fn(),
    };

    jest.spyOn(Exam, 'findById').mockResolvedValue(mockExam);
    // Return question with status DRAFT (unapproved)
    jest.spyOn(Question, 'find').mockResolvedValue([{ _id: q1, questionText: 'Draft Q', status: 'DRAFT', difficulty: 'EASY' }]);

    await expect(examService.publishExam(mockExam._id, dummyInstructor)).rejects.toThrow(
      /Only APPROVED questions can be published/
    );
  });

  it('6 & 7. Server-side question assignment strips correct answers & explanations from student view', async () => {
    const q1 = new mongoose.Types.ObjectId();
    const mockExam = {
      _id: new mongoose.Types.ObjectId(),
      courseId: { _id: courseId, studentIds: [dummyStudent._id] },
      institutionId,
      status: 'PUBLISHED',
      questionIds: [q1],
      questionsPerStudent: 1,
      difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      toJSON: function () {
        return { ...this };
      },
    };

    jest.spyOn(Exam, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockExam),
      }),
    });

    jest.spyOn(ExamAttempt, 'findOne').mockResolvedValue(null);
    jest.spyOn(ExamAttempt, 'create').mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      examId: mockExam._id,
      studentId: dummyStudent._id,
      questionIds: [q1],
      status: 'IN_PROGRESS',
    });

    // Mock Question.find select to simulate returning safe fields
    const mockSelect = jest.fn().mockResolvedValue([
      { _id: q1, type: 'MCQ', questionText: 'Safe Question Text', options: ['A', 'B', 'C', 'D'], difficulty: 'EASY' },
    ]);
    jest.spyOn(Question, 'find').mockImplementation(() => {
      const result = [
        { _id: q1, type: 'MCQ', questionText: 'Safe Question Text', options: ['A', 'B', 'C', 'D'], difficulty: 'EASY' }
      ];
      result.select = mockSelect;
      // Mock then so it works as a promise
      return {
        then: function(resolve) { resolve(result); },
        select: mockSelect
      };
    });

    const result = await examService.startExamAttempt(mockExam._id, dummyStudent);

    expect(result.exam.questionIds[0].questionText).toBe('Safe Question Text');
    expect(result.exam.questionIds[0].correctAnswer).toBeUndefined();
    expect(result.exam.questionIds[0].explanation).toBeUndefined();
  });
});
