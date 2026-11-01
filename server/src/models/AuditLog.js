const mongoose = require('mongoose');

/**
 * AuditLog (SAD 4.1, SR-06)
 * Records every admin action so it can be traced to an account later
 * (e.g. "which admin removed this posting, and when?").
 */
const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g. ONBOARD_RECRUITER, APPROVE_LISTING
    targetType: { type: String }, // e.g. User, Listing
    targetId: { type: mongoose.Schema.Types.ObjectId },
    outcome: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
    details: { type: String },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
