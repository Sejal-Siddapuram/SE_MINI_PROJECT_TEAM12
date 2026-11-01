const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const ROLES = require('../utils/roles');
const { APPROVAL_STATUS } = require('../models/Listing');

const router = express.Router();

// Every /api/admin route is for the TPO/Admin only (SR-03, BR-05)
router.use(authenticate, authorize(ROLES.ADMIN));

const onboardRules = [
  body('name')
    .isString().withMessage('Name is required.').bail()
    .trim().notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters.'),
  body('email')
    .isString().withMessage('Email is required.').bail()
    .trim().isEmail().withMessage('Enter a valid email address.'),
  body('company')
    .isString().withMessage('Company is required.').bail()
    .trim().notEmpty().withMessage('Company is required.')
    .isLength({ max: 120 }).withMessage('Company must be at most 120 characters.'),
  body('password')
    .isString().withMessage('Temporary password is required.').bail()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter.')
    .matches(/[0-9]/).withMessage('Password must contain a digit.'),
];

const moderationRules = [
  param('id').isMongoId().withMessage('Invalid listing id.'),
  body('action').isIn(['approve', 'remove', 'edit']).withMessage('Action must be approve, remove or edit.'),
  body('reason').optional().isString().trim().isLength({ max: 300 }),
  body('updates').optional().isObject().withMessage('Updates must be an object.'),
  body('updates.title').optional().isString().trim().notEmpty().withMessage('Title cannot be empty.'),
  body('updates.description').optional().isString().trim().notEmpty().withMessage('Description cannot be empty.'),
];

router.post('/recruiters', onboardRules, validate, adminController.onboardRecruiter); // FR-10
router.get('/recruiters', adminController.listRecruiters); // FR-10
router.get(
  '/listings',
  query('approvalStatus').optional().isIn(APPROVAL_STATUS).withMessage('Invalid approval status.'),
  validate,
  adminController.listListings
); // FR-10
router.patch('/listings/:id/moderation', moderationRules, validate, adminController.moderateListing); // FR-10
router.get('/audit-logs', adminController.getAuditLogs); // SR-06

module.exports = router;
