const mongoose = require('mongoose');

const practiceAssessmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    status: { type: String, enum: ['COMPLETED'], default: 'COMPLETED' },
    questions: [
      {
        questionText: String,
        selectedOption: String,
        correctAnswer: String,
        isCorrect: Boolean,
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PracticeAssessment', practiceAssessmentSchema);
