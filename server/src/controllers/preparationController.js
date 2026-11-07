const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/preparationService');
exports.listTests = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.listTests() });
});
exports.getTest = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getTest(req.params.id) });
});
exports.submitTest = asyncHandler(async (req, res) => {
  const attempt = await service.submitTest(req.user.id, req.params.id, req.body.answers, req.ip);
  res.status(201).json({ success: true, data: attempt });
});
exports.listAttempts = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listAttempts(req.user.id) });
});
exports.getInterviewContent = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: service.getInterviewContent() });
});
