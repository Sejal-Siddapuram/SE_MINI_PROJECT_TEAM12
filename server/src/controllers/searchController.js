const asyncHandler = require('../utils/asyncHandler');
const searchService = require('../services/searchService');

// GET /api/listings?keyword=&role=&company=&location=&type=&deadlineBefore=&page=&limit=  (FR-04)
const search = asyncHandler(async (req, res) => {
  const data = await searchService.searchListings(req.query);
  res.json({ success: true, data });
});

// GET /api/listings/:id  (FR-04)
const getById = asyncHandler(async (req, res) => {
  const data = await searchService.getListingById(req.params.id);
  res.json({ success: true, data });
});

module.exports = { search, getById };
