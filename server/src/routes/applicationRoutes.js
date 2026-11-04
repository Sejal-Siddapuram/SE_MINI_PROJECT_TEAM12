const express = require('express');
const { body, param } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const ROLES = require('../utils/roles');

const router = express.Router();

// Only logged-in students can apply (FR-05, SR-03)
const studentOnly = [authenticate, authorize(ROLES.STUDENT)];

router.post(
  '/',
  studentOnly,
  body('listingId').isMongoId().withMessage('Invalid listing id.'),
  validate,
  applicationController.apply
);

router.get('/me', studentOnly, applicationController.myApplications);

router.delete(
  '/:id',
  studentOnly,
  param('id').isMongoId().withMessage('Invalid application id.'),
  validate,
  applicationController.withdraw
);

module.exports = router;
