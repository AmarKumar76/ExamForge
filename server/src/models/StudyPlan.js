const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema(
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
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Roadmap title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    dailySchedule: [
      {
        dayNumber: { type: Number },
        dayLabel: { type: String },
        topic: { type: String },
        activityType: { type: String, default: 'LEARN' }, // 'LEARN', 'PRACTICE', 'REVISION', 'MOCK_TEST'
        durationMinutes: { type: Number, default: 45 },
        priority: { type: String, default: 'MEDIUM' },
        isConvertedToTask: { type: Boolean, default: false },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyTask', default: null },
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
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

studyPlanSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
