const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientEmail: { type: String, trim: true, lowercase: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId, index: true },
    status: { type: String, enum: ['SENT', 'FAILED', 'PENDING'], default: 'SENT', index: true },
    failureReason: { type: String, default: null },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationSchema.index({ studentId: 1, relatedId: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
