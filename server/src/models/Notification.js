const mongoose = require('mongoose');

/**
 * Notification - SRS Section 14 (userId, message, type, read, createdAt)
 * An in-app message for a user, e.g. "Your application for X is now Shortlisted." (FR-06, UC-11)
 */
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  type: { type: String, default: 'StatusChange' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// "My notifications", newest first
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
