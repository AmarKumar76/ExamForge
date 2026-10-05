const mongoose = require('mongoose');
const Question = require('../../src/models/Question');

describe('Question Model Unit Tests', () => {
  it('should create a valid Question document with DRAFT status by default', async () => {
    const validData = {
      courseId: new mongoose.Types.ObjectId(),
      institutionId: new mongoose.Types.ObjectId(),
      type: 'MCQ',
      questionText: 'What is operating system page size?',
      options: ['4KB', '8KB', '16KB', '32KB'],
      correctAnswer: '4KB',
      explanation: 'Typical page size is 4KB.',
      difficulty: 'MEDIUM',
      topic: 'Virtual Memory',
      createdBy: new mongoose.Types.ObjectId(),
    };

    const question = new Question(validData);
    const err = question.validateSync();
    expect(err).toBeUndefined();
    expect(question.status).toBe('DRAFT');
    expect(question.generationSource).toBe('AI_RAG');
  });

  it('should fail validation if required fields are missing', async () => {
    const invalidQuestion = new Question({
      difficulty: 'HARD',
    });

    const err = invalidQuestion.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.courseId).toBeDefined();
    expect(err.errors.questionText).toBeDefined();
    expect(err.errors.correctAnswer).toBeDefined();
  });
});
