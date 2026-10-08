const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionFolder',
      default: null,
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'],
        message: 'Invalid question type: {VALUE}',
      },
      required: [true, 'Question type is required'],
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
      required: true,
    },
    topic: {
      type: String,
      default: 'General',
      trim: true,
    },
    sourceMaterialIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseMaterial',
      },
    ],
    sourceChunkIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaterialChunk',
      },
    ],
    sourceReferences: [
      {
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseMaterial' },
        fileName: { type: String, default: '' },
        pageNumber: { type: Number, default: null },
        snippet: { type: String, default: '' },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
    },
    generationSource: {
      type: String,
      enum: ['MANUAL', 'AI_RAG'],
      default: 'AI_RAG',
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'REJECTED', 'ARCHIVED'],
      default: 'DRAFT',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

questionSchema.index({ courseId: 1, status: 1 });
questionSchema.index({ institutionId: 1, status: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
