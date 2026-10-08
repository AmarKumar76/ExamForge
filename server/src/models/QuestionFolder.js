const mongoose = require('mongoose');

const questionFolderSchema = new mongoose.Schema(
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
      required: [true, 'Folder/Unit title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
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

questionFolderSchema.index({ courseId: 1, orderIndex: 1 });

const QuestionFolder = mongoose.model('QuestionFolder', questionFolderSchema);

module.exports = QuestionFolder;
