const express = require('express');
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const ROLES = require('../utils/roles');

const router = express.Router();

// Students and recruiters each see only their own notifications (UC-11)
router.get('/', authenticate, authorize(ROLES.STUDENT, ROLES.RECRUITER), notificationController.list);

module.exports = router;
