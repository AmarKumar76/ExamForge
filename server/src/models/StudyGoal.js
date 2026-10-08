const mongoose = require('mongoose');

const studyGoalSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
    targetDate: {
      type: Date,
      required: [true, 'Target date is required'],
    },
    dailyStudyTimeMinutes: {
      type: Number,
      default: 120,
    },
    currentLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    preferredActivities: [
      {
        type: String,
        enum: ['LEARN', 'PRACTICE', 'REVISION', 'MOCK_TEST'],
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

studyGoalSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('StudyGoal', studyGoalSchema);
