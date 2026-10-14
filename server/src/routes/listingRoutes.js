const express = require('express');
const { body, param } = require('express-validator');
const listingController = require('../controllers/listingController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const ROLES = require('../utils/roles');
const { LISTING_TYPES } = require('../models/Listing');

const router = express.Router();

// Only logged-in recruiters can manage listings (FR-07, SR-03).
// Applied per route (not router.use) because /api/listings is shared with the student search routes.
const recruiterOnly = [authenticate, authorize(ROLES.RECRUITER)];

const idRule = param('id').isMongoId().withMessage('Invalid listing id.');

/** Validation rules. "optional" = for edits, where only changed fields are sent */
function listingRules({ optional }) {
  const field = (name) => (optional ? body(name).optional() : body(name));
  return [
    field('title')
      .isString().withMessage('Title is required.').bail()
      .trim().notEmpty().withMessage('Title is required.')
      .isLength({ max: 120 }).withMessage('Title must be at most 120 characters.'),
    field('role')
      .isString().withMessage('Role is required.').bail()
      .trim().notEmpty().withMessage('Role is required.')
      .isLength({ max: 80 }).withMessage('Role must be at most 80 characters.'),
    body('type')
      .optional()
      .isIn(LISTING_TYPES).withMessage('Type must be Internship or Full-time.'),
    field('location')
      .isString().withMessage('Location is required.').bail()
      .trim().notEmpty().withMessage('Location is required.')
      .isLength({ max: 80 }).withMessage('Location must be at most 80 characters.'),
    field('description')
      .isString().withMessage('Description is required.').bail()
      .trim().notEmpty().withMessage('Description is required.')
      .isLength({ max: 5000 }).withMessage('Description must be at most 5000 characters.'),
    body('eligibility')
      .optional()
      .isString().withMessage('Eligibility must be text.').bail()
      .trim().isLength({ max: 500 }).withMessage('Eligibility must be at most 500 characters.'),
    field('deadline')
      .isISO8601().withMessage('Enter a valid deadline date.')
      .toDate(),
  ];
}

router.post('/', recruiterOnly, listingRules({ optional: false }), validate, listingController.create);
router.put('/:id', recruiterOnly, idRule, listingRules({ optional: true }), validate, listingController.update);
router.patch(
  '/:id/publish',
  recruiterOnly,
  idRule,
  body('action').isIn(['publish', 'close']).withMessage('Action must be "publish" or "close".'),
  validate,
  listingController.publish
);

module.exports = router;
