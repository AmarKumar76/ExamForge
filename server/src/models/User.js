const mongoose = require('mongoose');
const { ROLES, ACCOUNT_STATUS } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please enter a valid email address',
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Exclude passwordHash from query results by default
    },
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: 'Invalid user role: {VALUE}',
      },
      default: ROLES.STUDENT,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ACCOUNT_STATUS),
        message: 'Invalid account status: {VALUE}',
      },
      default: ACCOUNT_STATUS.ACTIVE,
      required: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
    },
    // Student specific fields (sparse unique index: absent when undefined)
    enrollmentNumber: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true },
    },
    rollNumber: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true },
    },
    semester: {
      type: String,
      trim: true,
      default: '',
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    // Instructor specific fields (sparse unique index: absent when undefined)
    employeeId: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true },
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    notificationPreferences: {
      examSubmissions: { type: Boolean, default: true },
      resultUpdates: { type: Boolean, default: true },
      aiQuestionGen: { type: Boolean, default: true },
      studentActivity: { type: Boolean, default: true },
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Method to return safe JSON profile object without sensitive data
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    institutionId: this.institutionId,
    enrollmentNumber: this.enrollmentNumber || null,
    rollNumber: this.rollNumber || null,
    semester: this.semester || '',
    batch: this.batch || '',
    employeeId: this.employeeId || null,
    avatar: this.avatar,
    phone: this.phone || '',
    department: this.department || '',
    isVerified: this.isVerified ?? false,
    themePreference: this.themePreference || 'light',
    notificationPreferences: this.notificationPreferences || {
      examSubmissions: true,
      resultUpdates: true,
      aiQuestionGen: true,
      studentActivity: true,
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
