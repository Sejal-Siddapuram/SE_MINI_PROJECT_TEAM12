const Application = require('../models/Application');
const Listing = require('../models/Listing');
const StudentProfile = require('../models/StudentProfile');
const AppError = require('../utils/AppError');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * A profile is complete when it has at least one skill and an uploaded resume.
 * Returns the list of missing parts so the UI can tell the student what to fix.
 * (Kept in one function so the rule is easy to change if the team decides otherwise.)
 */
function missingProfileParts(profile) {
  const missing = [];
  if (!profile || !profile.skills || profile.skills.length === 0) {
    missing.push({ field: 'skills', message: 'Add at least one skill to your profile.' });
  }
  if (!profile || !profile.resumeUrl) {
    missing.push({ field: 'resume', message: 'Upload your resume to your profile.' });
  }
  return missing;
}

/**
 * FR-05: a student applies to a listing.
 *  - the listing must be Published and Approved, otherwise the student cannot see it (404)
 *  - BR-04: no application after the deadline (410 DEADLINE_PASSED)
 *  - the student's profile must be complete (400 PROFILE_INCOMPLETE)
 *  - BR-01: only one active application per listing (409 DUPLICATE_APPLICATION)
 */
async function applyToListing(studentId, listingId) {
  const listing = await Listing.findOne({
    _id: listingId,
    status: 'Published',
    approvalStatus: 'Approved',
  });
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');

  // Same rule the listing form uses: the deadline day itself is still open
  if (listing.deadline < startOfToday()) {
    throw new AppError(410, 'DEADLINE_PASSED', 'The deadline for this listing has passed.');
  }

  const profile = await StudentProfile.findOne({ userId: studentId });
  const missing = missingProfileParts(profile);
  if (missing.length > 0) {
    throw new AppError(400, 'PROFILE_INCOMPLETE', 'Complete your profile before applying.', missing);
  }

  try {
    return await Application.create({ studentId, listingId: listing._id });
  } catch (err) {
    // 11000 = the unique (studentId, listingId) index rejected a second application
    if (err && err.code === 11000) {
      throw new AppError(409, 'DUPLICATE_APPLICATION', 'You already have an active application for this listing.');
    }
    throw err;
  }
}

module.exports = { applyToListing, missingProfileParts };
