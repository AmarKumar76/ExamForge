const mongoose = require('mongoose');

const revisionPlanSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Revision plan title is required'],
      trim: true,
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
    dailyStudyTimeMinutes: {
      type: Number,
      default: 120,
    },
    proximityStage: {
      type: String,
      default: 'NORMAL_STUDY',
    },
    schedule: [
      {
        dayNumber: { type: Number },
        dayLabel: { type: String },
        title: { type: String },
        topic: { type: String },
        durationMinutes: { type: Number, default: 45 },
        focus: { type: String, default: '' },
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

revisionPlanSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('RevisionPlan', revisionPlanSchema);
