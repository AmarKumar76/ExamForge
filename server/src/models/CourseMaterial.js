const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema(
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
      required: [true, 'Material title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'Stored filename is required'],
      trim: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    fileType: {
      type: String,
      enum: {
        values: ['PDF', 'DOCX', 'PPTX'],
        message: 'Invalid file type: {VALUE}. Allowed formats are PDF, DOCX, and PPTX.',
      },
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileKey: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED'],
      default: 'READY',
      required: true,
    },
    processingStatus: {
      type: String,
      enum: ['NOT_PROCESSED', 'PROCESSING', 'PROCESSED', 'FAILED'],
      default: 'NOT_PROCESSED',
      required: true,
    },
    processingStartedAt: {
      type: Date,
      default: null,
    },
    processingCompletedAt: {
      type: Date,
      default: null,
    },
    processingError: {
      type: String,
      default: null,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    extractedTextLength: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'DRAFT',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    metadata: {
      topic: { type: String, default: '' },
      pageCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Do not expose raw internal filesystem paths in API responses
        delete ret.fileKey;
        return ret;
      },
    },
  }
);

// Compound indexes for querying
courseMaterialSchema.index({ courseId: 1, visibility: 1, status: 1 });
courseMaterialSchema.index({ institutionId: 1, status: 1 });

const CourseMaterial = mongoose.model('CourseMaterial', courseMaterialSchema);

module.exports = CourseMaterial;
