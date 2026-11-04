const asyncHandler = require('../utils/asyncHandler');
const applicationService = require('../services/applicationService');

// POST /api/applications  { listingId }  (FR-05)
const apply = asyncHandler(async (req, res) => {
  const application = await applicationService.applyToListing(req.user.id, req.body.listingId);
  res.status(201).json({ success: true, data: application });
});

// GET /api/applications/me  (FR-06)
const myApplications = asyncHandler(async (req, res) => {
  const items = await applicationService.listMyApplications(req.user.id);
  res.json({ success: true, data: items });
});

// DELETE /api/applications/:id  (FR-06)
const withdraw = asyncHandler(async (req, res) => {
  await applicationService.withdrawApplication(req.user.id, req.params.id);
  res.status(204).send();
});

module.exports = { apply, myApplications, withdraw };
