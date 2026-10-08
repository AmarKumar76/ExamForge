const mongoose = require('mongoose');

const similarityReportSchema = new mongoose.Schema(
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
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: [true, 'Attempt ID is required'],
      index: true,
    },
    comparedAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: [true, 'Compared Attempt ID is required'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    comparedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Compared Student ID is required'],
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question ID is required'],
      index: true,
    },
    similarityScore: {
      type: Number,
      required: true, // percentage 0 - 100
    },
    thresholdUsed: {
      type: Number,
      default: 75,
    },
    flaggedSnippet: {
      type: String,
      default: '',
    },
    comparedSnippet: {
      type: String,
      default: '',
    },
    reviewStatus: {
      type: String,
      enum: ['UNREVIEWED', 'UNDER_REVIEW', 'REVIEWED', 'DISMISSED'],
      default: 'UNREVIEWED',
      index: true,
    },
    reviewNote: {
      type: String,
      default: '',
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

similarityReportSchema.index({ examId: 1, similarityScore: -1 });

module.exports = mongoose.model('SimilarityReport', similarityReportSchema);
