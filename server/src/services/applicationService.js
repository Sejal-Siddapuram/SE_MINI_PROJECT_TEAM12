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

/** FR-06: the student's own applications, newest first, with the listing details */
async function listMyApplications(studentId) {
  const applications = await Application.find({ studentId })
    .sort({ appliedAt: -1 })
    .populate('listingId', 'title company location type deadline');
  return applications.map((a) => ({
    id: a._id,
    status: a.status,
    appliedAt: a.appliedAt,
    // listing is null if the listing was removed after the student applied
    listing: a.listingId
      ? {
          id: a.listingId._id,
          title: a.listingId.title,
          company: a.listingId.company,
          location: a.listingId.location,
          type: a.listingId.type,
          deadline: a.listingId.deadline,
        }
      : null,
  }));
}

/**
 * FR-06: a student withdraws their own application, only while it is still Applied.
 * The application is deleted, so the student may apply to the same listing again (BR-01).
 *  - 404 APPLICATION_NOT_FOUND, 403 FORBIDDEN (someone else's), 409 DECISION_MADE
 */
async function withdrawApplication(studentId, applicationId) {
  const application = await Application.findById(applicationId);
  if (!application) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Application not found.');
  if (String(application.studentId) !== String(studentId)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only withdraw your own application.');
  }

  // Delete only if the status is still Applied at this moment, so a recruiter's decision
  // that arrives at the same time cannot be undone by a withdrawal.
  const deleted = await Application.findOneAndDelete({ _id: application._id, status: 'Applied' });
  if (!deleted) {
    throw new AppError(409, 'DECISION_MADE', 'The recruiter has already responded, so this application cannot be withdrawn.');
  }
}

module.exports = { applyToListing, missingProfileParts, listMyApplications, withdrawApplication };
