const asyncHandler = require('../utils/asyncHandler');
const listingService = require('../services/listingService');

// POST /api/listings  (FR-07)
const create = asyncHandler(async (req, res) => {
  const listing = await listingService.createListing(req.user.id, req.body);
  res.status(201).json({ success: true, data: listing });
});

// PUT /api/listings/:id  (FR-07)
const update = asyncHandler(async (req, res) => {
  const listing = await listingService.updateListing(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: listing });
});

// PATCH /api/listings/:id/publish  { action: 'publish' | 'close' }  (FR-07)
const publish = asyncHandler(async (req, res) => {
  const listing = await listingService.setPublishState(req.user.id, req.params.id, req.body.action);
  res.json({ success: true, data: listing });
});

// GET /api/recruiter/listings  (FR-07)
const getMine = asyncHandler(async (req, res) => {
  const listings = await listingService.getMyListings(req.user.id);
  res.json({ success: true, data: listings });
});

// GET /api/recruiter/listings/:id  (FR-07)
const getMineById = asyncHandler(async (req, res) => {
  const listing = await listingService.getOwnListing(req.user.id, req.params.id);
  res.json({ success: true, data: listing });
});

module.exports = { create, update, publish, getMine, getMineById };
