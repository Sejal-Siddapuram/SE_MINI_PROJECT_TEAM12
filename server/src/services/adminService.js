const User = require('../models/User');
const Listing = require('../models/Listing');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');
const ROLES = require('../utils/roles');
const { hashPassword, toPublicUser } = require('./authService');

/** Writes one entry to the audit log (SR-06) */
async function audit(adminId, action, target, details, ip) {
  await AuditLog.create({
    userId: adminId,
    action,
    targetType: target.type,
    targetId: target.id,
    details,
    ip,
  });
}

/**
 * FR-10 / BR-05: only the TPO/Admin can create recruiter accounts.
 * The admin sets a temporary password and shares it with the recruiter.
 */
async function onboardRecruiter(adminId, { name, email, company, password }, ip) {
  const normalizedEmail = email.toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists.', [
      { field: 'email', message: 'This email is already registered.' },
    ]);
  }

  const recruiter = await User.create({
    name,
    email: normalizedEmail,
    company,
    passwordHash: await hashPassword(password),
    role: ROLES.RECRUITER,
  });

  await audit(adminId, 'ONBOARD_RECRUITER', { type: 'User', id: recruiter._id }, `${name} (${company})`, ip);
  return toPublicUser(recruiter);
}

/** FR-10: list all recruiter accounts, newest first */
async function listRecruiters() {
  const recruiters = await User.find({ role: ROLES.RECRUITER }).sort({ createdAt: -1 });
  return recruiters.map((r) => ({ ...toPublicUser(r), createdAt: r.createdAt }));
}

/** FR-10: all listings for moderation, optionally filtered by approval status */
async function listListingsForModeration(approvalStatus) {
  const filter = approvalStatus ? { approvalStatus } : {};
  return Listing.find(filter).sort({ createdAt: -1 }).populate('recruiterId', 'name email');
}

// Fields the admin may correct when editing a posting
const ADMIN_EDITABLE_FIELDS = ['title', 'role', 'location', 'description', 'eligibility'];

/**
 * FR-10: moderate a listing before or after publication.
 *   approve -> visible to students once the recruiter publishes it (BR-02)
 *   remove  -> hidden from students; the recruiter can no longer edit or publish it
 *   edit    -> admin corrects the text of the posting
 */
async function moderateListing(adminId, listingId, { action, reason, updates }, ip) {
  const listing = await Listing.findById(listingId);
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');

  let details = listing.title;

  if (action === 'approve') {
    listing.approvalStatus = 'Approved';
  } else if (action === 'remove') {
    listing.approvalStatus = 'Removed';
    if (reason) details += ` - reason: ${reason}`;
  } else if (action === 'edit') {
    const changed = [];
    ADMIN_EDITABLE_FIELDS.forEach((key) => {
      if (updates && typeof updates[key] === 'string' && updates[key] !== listing[key]) {
        listing[key] = updates[key];
        changed.push(key);
      }
    });
    details += changed.length ? ` - edited: ${changed.join(', ')}` : ' - no changes';
  }

  await listing.save();
  await audit(adminId, `${action.toUpperCase()}_LISTING`, { type: 'Listing', id: listing._id }, details, ip);
  return listing.populate('recruiterId', 'name email');
}

/** SR-06: most recent admin actions */
async function getRecentAuditLogs(limit = 10) {
  return AuditLog.find().sort({ createdAt: -1 }).limit(limit).populate('userId', 'name email');
}

module.exports = {
  onboardRecruiter,
  listRecruiters,
  listListingsForModeration,
  moderateListing,
  getRecentAuditLogs,
};
