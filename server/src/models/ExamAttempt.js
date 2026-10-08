const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution ID is required'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student User ID is required'],
      index: true,
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'GRADED', 'PUBLISHED'],
      default: 'IN_PROGRESS',
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    resultPublishedAt: {
      type: Date,
      default: null,
    },
    resultPublishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    integritySignals: [
      {
        signalType: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
        source: { type: String, default: 'CLIENT' },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
      }
    ],
    questionTimings: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        openedAt: { type: Date },
        answeredAt: { type: Date },
        timeSpentSeconds: { type: Number, default: 0 }
      }
    ],
    integritySummary: {
      totalSignals: { type: Number, default: 0 },
      riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
      signalCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
      aiSummary: { type: String, default: '' },
      aiRecommendation: { type: String, default: '' },
      reviewStatus: { type: String, enum: ['UNREVIEWED', 'PENDING', 'REVIEWING', 'REVIEWED', 'FLAGGED', 'ESCALATED'], default: 'UNREVIEWED' },
      instructorNote: { type: String, default: '' },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        selectedOption: {
          type: String,
          default: '',
        },
        textAnswer: {
          type: String,
          default: '',
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        marksObtained: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    aiAnalysis: {
      strengths: { type: [String], default: [] },
      weakTopics: { type: [String], default: [] },
      recommendations: { type: [String], default: [] },
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

examAttemptSchema.index({ examId: 1, studentId: 1 });
examAttemptSchema.index({ courseId: 1, studentId: 1 });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);

module.exports = ExamAttempt;
