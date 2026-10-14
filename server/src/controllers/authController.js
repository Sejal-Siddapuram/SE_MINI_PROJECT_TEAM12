const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

// POST /api/auth/register  (FR-01)
const register = asyncHandler(async (req, res) => {
  const data = await authService.registerStudent(req.body);
  res.status(201).json({ success: true, data });
});

// POST /api/auth/login  (FR-02)
const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json({ success: true, data });
});

// GET /api/auth/me  (FR-02)
const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.json({ success: true, data: { user } });
});

module.exports = { register, login, me };
