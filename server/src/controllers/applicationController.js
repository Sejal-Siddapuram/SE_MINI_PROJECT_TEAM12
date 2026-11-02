const asyncHandler = require('../utils/asyncHandler');
const applicationService = require('../services/applicationService');

// POST /api/applications  { listingId }  (FR-05)
const apply = asyncHandler(async (req, res) => {
  const application = await applicationService.applyToListing(req.user.id, req.body.listingId);
  res.status(201).json({ success: true, data: application });
});

module.exports = { apply };
