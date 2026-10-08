const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGoal',
      default: null,
      index: true,
    },
    revisionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RevisionPlan',
      default: null,
      index: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPlan',
      default: null,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionFolder',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
    },
    dueDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dueTime: {
      type: String,
      default: '19:00',
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 45,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reminder: {
      enabled: { type: Boolean, default: false },
      reminderTime: { type: Date, default: null },
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: String,
      default: 'NONE', // 'NONE', 'DAILY', 'WEEKLY'
    },
    orderIndex: {
      type: Number,
      default: 0,
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

studyTaskSchema.index({ studentId: 1, dueDate: 1, status: 1 });

module.exports = mongoose.model('StudyTask', studyTaskSchema);
