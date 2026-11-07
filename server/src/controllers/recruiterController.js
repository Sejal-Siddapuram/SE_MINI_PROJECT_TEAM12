const asyncHandler = require('../utils/asyncHandler');
const recruiterService = require('../services/recruiterService');

// GET /api/recruiter/listings/:id/applicants  (FR-08)
const getApplicants = asyncHandler(async (req, res) => {
  const data = await recruiterService.getApplicants(req.user.id, req.params.id);
  res.json({ success: true, data });
});

// GET /api/recruiter/listings/:id/applicants/summary  (FR-09)
const getApplicantSummary = asyncHandler(async (req, res) => {
  const data = await recruiterService.getApplicantSummary(req.user.id, req.params.id);
  res.json({ success: true, data });
});

// PATCH /api/recruiter/applications/:id  { status }  (FR-09)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const data = await recruiterService.updateApplicationStatus(
    req.user.id,
    req.params.id,
    req.body.status
  );
  res.json({ success: true, data });
});

module.exports = { getApplicants, getApplicantSummary, updateApplicationStatus };
