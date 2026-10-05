const mongoose = require('mongoose');

const materialChunkSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseMaterial',
      required: [true, 'Material ID is required'],
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
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Chunk text content is required'],
    },
    pageNumber: {
      type: Number,
      default: null,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    sourceFileName: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      default: [],
      select: true,
    },
    embeddingDimensions: {
      type: Number,
      default: 768,
    },
    embeddingProvider: {
      type: String,
      default: 'gemini',
      enum: ['gemini', 'local'],
    },
    embeddingModel: {
      type: String,
      default: 'text-embedding-004',
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

materialChunkSchema.index({ materialId: 1, chunkIndex: 1 });
materialChunkSchema.index({ courseId: 1, topic: 1 });

const MaterialChunk = mongoose.model('MaterialChunk', materialChunkSchema);

module.exports = MaterialChunk;
