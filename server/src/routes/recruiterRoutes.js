const express = require('express');
const { param, body } = require('express-validator');
const listingController = require('../controllers/listingController');
const recruiterController = require('../controllers/recruiterController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const ROLES = require('../utils/roles');
const { APPLICATION_STATUS } = require('../models/Application');

const router = express.Router();

// Every /api/recruiter route is for logged-in recruiters only (SR-03)
router.use(authenticate, authorize(ROLES.RECRUITER));

const idParam = param('id').isMongoId().withMessage('Invalid id.');

router.get('/listings', listingController.getMine); // FR-07
router.get('/listings/:id', idParam, validate, listingController.getMineById); // FR-07

router.get('/listings/:id/applicants', idParam, validate, recruiterController.getApplicants); // FR-08
router.get('/listings/:id/applicants/summary', idParam, validate, recruiterController.getApplicantSummary); // FR-09

router.patch(
  '/applications/:id',
  idParam,
  body('status').isIn(APPLICATION_STATUS).withMessage('Invalid status value.'),
  validate,
  recruiterController.updateApplicationStatus
); // FR-09

module.exports = router;
