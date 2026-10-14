const express = require('express');
const { param } = require('express-validator');
const listingController = require('../controllers/listingController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const ROLES = require('../utils/roles');

const router = express.Router();

// Every /api/recruiter route is for logged-in recruiters only (SR-03)
router.use(authenticate, authorize(ROLES.RECRUITER));

router.get('/listings', listingController.getMine); // FR-07
router.get(
  '/listings/:id',
  param('id').isMongoId().withMessage('Invalid listing id.'),
  validate,
  listingController.getMineById
); // FR-07

module.exports = router;
