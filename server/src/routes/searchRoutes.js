const express = require('express');
const { param, query } = require('express-validator');
const searchController = require('../controllers/searchController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const ROLES = require('../utils/roles');
const { LISTING_TYPES } = require('../models/Listing');

const router = express.Router();

// Search is for logged-in students (SAD 4.3).
// Applied per route (not router.use) because /api/listings is shared with the recruiter routes.
const studentOnly = [authenticate, authorize(ROLES.STUDENT)];

const textFilter = (name, label) =>
  query(name)
    .optional()
    .isString().withMessage(`${label} must be text.`).bail()
    .trim().isLength({ max: 100 }).withMessage(`${label} must be at most 100 characters.`);

const searchRules = [
  textFilter('keyword', 'Keyword'),
  textFilter('role', 'Role'),
  textFilter('company', 'Company'),
  textFilter('location', 'Location'),
  query('type').optional({ values: 'falsy' }).isIn(LISTING_TYPES).withMessage('Type must be Internship or Full-time.'),
  query('deadlineBefore').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid date.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be 1 or more.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
];

router.get('/', studentOnly, searchRules, validate, searchController.search); // FR-04
router.get(
  '/:id',
  studentOnly,
  param('id').isMongoId().withMessage('Invalid listing id.'),
  validate,
  searchController.getById
); // FR-04

module.exports = router;
