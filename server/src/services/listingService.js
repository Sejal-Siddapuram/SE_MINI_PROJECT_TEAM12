const Listing = require('../models/Listing');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// Fields a recruiter is allowed to set (anything else in the request is ignored)
const EDITABLE_FIELDS = ['title', 'role', 'type', 'location', 'description', 'eligibility', 'deadline'];

function pickEditable(data) {
  return EDITABLE_FIELDS.reduce((acc, key) => {
    if (data[key] !== undefined) acc[key] = data[key];
    return acc;
  }, {});
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function assertDeadlineNotPast(deadline) {
  if (new Date(deadline) < startOfToday()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'The deadline cannot be in the past.', [
      { field: 'deadline', message: 'Choose today or a future date.' },
    ]);
  }
}

/** Loads a listing and makes sure it belongs to this recruiter (ownership check, SR-03) */
async function getOwnListing(recruiterId, listingId) {
  const listing = await Listing.findById(listingId);
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  if (listing.recruiterId.toString() !== recruiterId) {
    throw new AppError(403, 'FORBIDDEN', 'You can only manage your own listings.');
  }
  return listing;
}

/** FR-07: create a new listing. It starts as a Draft and is Pending admin approval. */
async function createListing(recruiterId, data) {
  const recruiter = await User.findById(recruiterId);
  if (!recruiter) throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');

  const fields = pickEditable(data);
  assertDeadlineNotPast(fields.deadline);

  return Listing.create({
    ...fields,
    recruiterId,
    company: recruiter.company || recruiter.name,
    status: 'Draft',
    approvalStatus: 'Pending',
  });
}

/** FR-07: list the recruiter's own listings, newest first */
async function getMyListings(recruiterId) {
  return Listing.find({ recruiterId }).sort({ createdAt: -1 });
}

/**
 * FR-07: edit a listing.
 * If it had already been approved, it goes back to Pending so the TPO
 * reviews the new content before students see it (BR-02).
 */
async function updateListing(recruiterId, listingId, data) {
  const listing = await getOwnListing(recruiterId, listingId);
  if (listing.approvalStatus === 'Removed') {
    throw new AppError(409, 'LISTING_REMOVED', 'This listing was removed by the TPO and cannot be edited.');
  }

  const fields = pickEditable(data);
  if (fields.deadline) assertDeadlineNotPast(fields.deadline);

  Object.assign(listing, fields);
  if (listing.approvalStatus === 'Approved') listing.approvalStatus = 'Pending';
  return listing.save();
}

/** FR-07: publish a listing, or close it so it stops taking applications */
async function setPublishState(recruiterId, listingId, action) {
  const listing = await getOwnListing(recruiterId, listingId);
  if (listing.approvalStatus === 'Removed') {
    throw new AppError(409, 'LISTING_REMOVED', 'This listing was removed by the TPO and cannot be published.');
  }

  if (action === 'publish') {
    assertDeadlineNotPast(listing.deadline);
    listing.status = 'Published';
    listing.publishedAt = new Date();
  } else {
    listing.status = 'Closed';
  }
  return listing.save();
}

module.exports = { getOwnListing, createListing, getMyListings, updateListing, setPublishState };
