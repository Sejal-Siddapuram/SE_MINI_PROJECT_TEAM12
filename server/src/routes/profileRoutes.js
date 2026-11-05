const express = require('express');
const { body } = require('express-validator');
const profileController = require('../controllers/profileController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { resumeUpload } = require('../middleware/resumeUpload');
const ROLES = require('../utils/roles');

const router = express.Router();

// Only a logged-in student can see or change their own profile (FR-03, SR-03)
router.use(authenticate, authorize(ROLES.STUDENT));

const updateRules = [
  body('name').optional()
    .isString().withMessage('Name must be text.').bail()
    .trim().notEmpty().withMessage('Name cannot be empty.')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters.'),
  body('branch').optional()
    .isString().withMessage('Branch must be text.').bail()
    .trim().notEmpty().withMessage('Branch cannot be empty.'),
  body('semester').optional()
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8.')
    .toInt(),
  body('cgpa').optional({ values: 'null' })
    .isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10.')
    .toFloat(),
  body('skills').optional()
    .isArray({ max: 20 }).withMessage('Add at most 20 skills.'),
  body('skills.*')
    .isString().withMessage('Each skill must be text.').bail()
    .trim().isLength({ min: 1, max: 30 }).withMessage('Each skill must be 1 to 30 characters.'),
];

router.get('/', profileController.getProfile); // FR-03
router.put('/', updateRules, validate, profileController.updateProfile); // FR-03
router.post('/resume', resumeUpload, profileController.uploadResume); // FR-03, SR-05
router.get('/resume', profileController.downloadResume); // FR-03

module.exports = router;
