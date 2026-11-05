const asyncHandler = require('../utils/asyncHandler');
const profileService = require('../services/profileService');

// GET /api/profile  (FR-03)
const getProfile = asyncHandler(async (req, res) => {
  const data = await profileService.getProfile(req.user.id);
  res.json({ success: true, data });
});

// PUT /api/profile  (FR-03)
const updateProfile = asyncHandler(async (req, res) => {
  const data = await profileService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data });
});

// POST /api/profile/resume  (FR-03, SR-05)
const uploadResume = asyncHandler(async (req, res) => {
  const data = await profileService.saveResume(req.user.id, req.file);
  res.json({ success: true, data });
});

// GET /api/profile/resume  (FR-03)
const downloadResume = asyncHandler(async (req, res) => {
  const { filePath, downloadName } = await profileService.getResumeFile(req.user.id);
  res.type('application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${downloadName.replace(/"/g, '')}"`);
  res.sendFile(filePath);
});

module.exports = { getProfile, updateProfile, uploadResume, downloadResume };
