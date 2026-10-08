const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
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
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
      maxlength: [200, 'Exam title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      default: 60,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    passingMarks: {
      type: Number,
      default: 40,
    },
    folderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionFolder',
      },
    ],
    questionSourceFolders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionFolder',
      },
    ],
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    questionsPerStudent: {
      type: Number,
      default: 0,
    },
    difficultyDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'ENDED', 'ARCHIVED', 'CANCELLED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
    },
    securitySettings: {
      fullscreenRequired: { type: Boolean, default: true },
      cameraMonitoring: { type: Boolean, default: true },
      faceDetection: { type: Boolean, default: true },
      multiplePersonDetection: { type: Boolean, default: true },
      tabSwitchMonitoring: { type: Boolean, default: true },
      copyPasteMonitoring: { type: Boolean, default: true },
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

examSchema.index({ courseId: 1, status: 1 });
examSchema.index({ institutionId: 1, status: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
