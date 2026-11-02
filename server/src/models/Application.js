const mongoose = require('mongoose');

/**
 * Application - SRS Section 14.4
 * A student's application to a listing (FR-05).
 *
 * A withdrawn application is deleted (SAD 4.1), so a student who withdrew can apply
 * again, and a plain unique index on (studentId, listingId) is enough to enforce BR-01.
 */
const APPLICATION_STATUS = ['Applied', 'Shortlisted', 'Rejected', 'Selected'];

const applicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  status: { type: String, enum: APPLICATION_STATUS, default: 'Applied', required: true },
  appliedAt: { type: Date, default: Date.now },
});

// BR-01: one active application per student per listing, enforced by the database itself
applicationSchema.index({ studentId: 1, listingId: 1 }, { unique: true });
// "My applications" page (FR-06), newest first
applicationSchema.index({ studentId: 1, appliedAt: -1 });
// Recruiter views of a listing's applicants and counts by status (FR-08, FR-09)
applicationSchema.index({ listingId: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.APPLICATION_STATUS = APPLICATION_STATUS;
