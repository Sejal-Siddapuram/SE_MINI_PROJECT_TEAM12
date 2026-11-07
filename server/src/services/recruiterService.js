const Application = require('../models/Application');
const Listing = require('../models/Listing');
const StudentProfile = require('../models/StudentProfile');
const AppError = require('../utils/AppError');

/**
 * FR-08: recruiter fetches all applicants for one of their listings.
 * Returns each application with the student's name, email, USN, branch,
 * semester, CGPA, skills, and resume reference.
 * 403 if the listing belongs to a different recruiter.
 * 404 if the listing does not exist.
 */
async function getApplicants(recruiterId, listingId) {
  const listing = await Listing.findById(listingId);
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  if (String(listing.recruiterId) !== String(recruiterId)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only view applicants for your own listings.');
  }

  const applications = await Application.find({ listingId })
    .sort({ appliedAt: 1 })
    .populate('studentId', 'name email');

  const studentIds = applications.map((a) => a.studentId._id);
  const profiles = await StudentProfile.find({ userId: { $in: studentIds } });
  const profileMap = Object.fromEntries(profiles.map((p) => [String(p.userId), p]));

  return applications.map((a) => {
    const profile = profileMap[String(a.studentId._id)] || null;
    return {
      applicationId: a._id,
      status: a.status,
      appliedAt: a.appliedAt,
      student: {
        id: a.studentId._id,
        name: a.studentId.name,
        email: a.studentId.email,
        usn: profile ? profile.usn : null,
        branch: profile ? profile.branch : null,
        semester: profile ? profile.semester : null,
        cgpa: profile ? profile.cgpa : null,
        skills: profile ? profile.skills : [],
        hasResume: profile ? !!profile.resumeUrl : false,
      },
    };
  });
}

/**
 * FR-09: recruiter shortlists or rejects an applicant.
 * Allowed transitions: Applied -> Shortlisted, Applied -> Rejected,
 *                      Shortlisted -> Selected, Shortlisted -> Rejected.
 * 403 if the listing does not belong to the recruiter.
 * 404 if the application does not exist.
 * 409 if the transition is not allowed from the current status.
 */
const ALLOWED_TRANSITIONS = {
  Applied: ['Shortlisted', 'Rejected'],
  Shortlisted: ['Selected', 'Rejected'],
};

async function updateApplicationStatus(recruiterId, applicationId, newStatus) {
  const application = await Application.findById(applicationId).populate('listingId');
  if (!application) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Application not found.');

  const listing = application.listingId;
  if (!listing || String(listing.recruiterId) !== String(recruiterId)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only update applications for your own listings.');
  }

  const allowed = ALLOWED_TRANSITIONS[application.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      409,
      'INVALID_TRANSITION',
      `Cannot move an application from '${application.status}' to '${newStatus}'.`
    );
  }

  application.status = newStatus;
  await application.save();
  return application;
}

/**
 * FR-09: summary counts of applicants by status for one listing.
 * 403 if the listing belongs to a different recruiter.
 * 404 if the listing does not exist.
 */
async function getApplicantSummary(recruiterId, listingId) {
  const listing = await Listing.findById(listingId);
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  if (String(listing.recruiterId) !== String(recruiterId)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only view summaries for your own listings.');
  }

  const counts = await Application.aggregate([
    { $match: { listingId: listing._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const summary = { Applied: 0, Shortlisted: 0, Rejected: 0, Selected: 0 };
  counts.forEach(({ _id, count }) => {
    if (_id in summary) summary[_id] = count;
  });
  summary.total = Object.values(summary).reduce((a, b) => a + b, 0);

  return summary;
}

module.exports = { getApplicants, updateApplicationStatus, getApplicantSummary };
