const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      maxlength: [150, 'Institution name cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'Institution code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    departments: {
      type: [String],
      default: ['Computer Science', 'Information Technology', 'Electrical Engineering', 'General'],
    },
    settings: {
      maxStudents: {
        type: Number,
        default: 5000,
      },
      allowSelfEnrollment: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      required: true,
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

const Institution = mongoose.model('Institution', institutionSchema);

module.exports = Institution;
