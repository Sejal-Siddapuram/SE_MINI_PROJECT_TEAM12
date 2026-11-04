const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

// GET /api/notifications  (UC-11)
const list = asyncHandler(async (req, res) => {
  const items = await notificationService.listMyNotifications(req.user.id);
  res.json({ success: true, data: items });
});

module.exports = { list };
