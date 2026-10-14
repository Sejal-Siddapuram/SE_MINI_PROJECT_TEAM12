const mongoose = require('mongoose');

/**
 * Listing - SRS Section 14.3
 * An internship or job opening posted by a recruiter (FR-07).
 *
 * status          -> controlled by the recruiter: Draft -> Published -> Closed
 * approvalStatus  -> controlled by the TPO/Admin (BR-02): Pending -> Approved / Removed
 * Students only see listings that are Published AND Approved.
 */
const LISTING_STATUS = ['Draft', 'Published', 'Closed'];
const APPROVAL_STATUS = ['Pending', 'Approved', 'Removed'];
const LISTING_TYPES = ['Internship', 'Full-time'];

const listingSchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, enum: LISTING_TYPES, default: 'Internship' },
    location: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    eligibility: { type: String, trim: true, maxlength: 500 },
    deadline: { type: Date, required: true },
    status: { type: String, enum: LISTING_STATUS, default: 'Draft', required: true },
    approvalStatus: { type: String, enum: APPROVAL_STATUS, default: 'Pending', required: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for fast search and "my listings" (SAD 4.1, NFR-01)
listingSchema.index({ status: 1, approvalStatus: 1, deadline: 1 });
listingSchema.index({ recruiterId: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
module.exports.LISTING_STATUS = LISTING_STATUS;
module.exports.APPROVAL_STATUS = APPROVAL_STATUS;
module.exports.LISTING_TYPES = LISTING_TYPES;
