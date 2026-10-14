const Listing = require('../models/Listing');
const AppError = require('../utils/AppError');
const escapeRegex = require('../utils/escapeRegex');

// BR-02: students only ever see listings that are Published by the recruiter AND Approved by the TPO
const VISIBLE_TO_STUDENTS = { status: 'Published', approvalStatus: 'Approved' };

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50; // SAD 4.3: lists are paginated, at most 50 per page

function contains(text) {
  return { $regex: escapeRegex(text.trim()), $options: 'i' };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** Short form of a listing used in search results */
function toSummary(listing) {
  return {
    id: listing._id.toString(),
    title: listing.title,
    company: listing.company,
    role: listing.role,
    type: listing.type,
    location: listing.location,
    deadline: listing.deadline,
    // BR-04: listings past their deadline stay visible but are marked as no longer open
    isOpen: listing.deadline >= startOfToday(),
  };
}

/**
 * FR-04: search and filter listings by keyword, role, company, location, type and deadline.
 * All filters are optional and can be combined. Results are paginated and sorted by
 * nearest deadline first.
 */
async function searchListings({ keyword, role, company, location, type, deadlineBefore, page = 1, limit = DEFAULT_LIMIT }) {
  const filter = { ...VISIBLE_TO_STUDENTS };

  if (keyword && keyword.trim()) {
    filter.$or = [
      { title: contains(keyword) },
      { description: contains(keyword) },
      { company: contains(keyword) },
      { role: contains(keyword) },
    ];
  }
  if (role && role.trim()) filter.role = contains(role);
  if (company && company.trim()) filter.company = contains(company);
  if (location && location.trim()) filter.location = contains(location);
  if (type) filter.type = type;
  if (deadlineBefore) filter.deadline = { $lte: endOfDay(deadlineBefore) };

  const pageSize = Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const pageNumber = Math.max(Number(page) || 1, 1);

  const [items, total] = await Promise.all([
    Listing.find(filter)
      .sort({ deadline: 1, _id: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Listing.countDocuments(filter),
  ]);

  return {
    items: items.map(toSummary),
    page: pageNumber,
    limit: pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

/** FR-04: full details of one listing (404 if it is not visible to students) */
async function getListingById(id) {
  const listing = await Listing.findOne({ _id: id, ...VISIBLE_TO_STUDENTS });
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'This listing does not exist or is no longer available.');

  return {
    ...toSummary(listing),
    description: listing.description,
    eligibility: listing.eligibility,
    publishedAt: listing.publishedAt,
  };
}

module.exports = { searchListings, getListingById };
