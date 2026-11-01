const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/adminService');

// POST /api/admin/recruiters  (FR-10, BR-05)
const onboardRecruiter = asyncHandler(async (req, res) => {
  const recruiter = await adminService.onboardRecruiter(req.user.id, req.body, req.ip);
  res.status(201).json({ success: true, data: recruiter });
});

// GET /api/admin/recruiters  (FR-10)
const listRecruiters = asyncHandler(async (req, res) => {
  const recruiters = await adminService.listRecruiters();
  res.json({ success: true, data: recruiters });
});

// GET /api/admin/listings?approvalStatus=Pending  (FR-10)
const listListings = asyncHandler(async (req, res) => {
  const listings = await adminService.listListingsForModeration(req.query.approvalStatus);
  res.json({ success: true, data: listings });
});

// PATCH /api/admin/listings/:id/moderation  (FR-10)
const moderateListing = asyncHandler(async (req, res) => {
  const listing = await adminService.moderateListing(req.user.id, req.params.id, req.body, req.ip);
  res.json({ success: true, data: listing });
});

// GET /api/admin/audit-logs  (SR-06)
const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await adminService.getRecentAuditLogs();
  res.json({ success: true, data: logs });
});

module.exports = { onboardRecruiter, listRecruiters, listListings, moderateListing, getAuditLogs };
