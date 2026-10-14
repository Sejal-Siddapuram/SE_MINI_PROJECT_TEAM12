const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// PES University USN format, e.g. PES1UG23CS400
const USN_PATTERN = /^PES[0-9]UG[0-9]{2}[A-Z]{2}[0-9]{3}$/i;

const registerRules = [
  body('name')
    .isString().withMessage('Name is required.').bail()
    .trim().notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters.'),
  body('usn')
    .isString().withMessage('USN is required.').bail()
    .trim().matches(USN_PATTERN).withMessage('Enter a valid USN, e.g. PES1UG24CS426.'),
  body('email')
    .isString().withMessage('Email is required.').bail()
    .trim().isEmail().withMessage('Enter a valid email address.'),
  body('password')
    .isString().withMessage('Password is required.').bail()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter.')
    .matches(/[0-9]/).withMessage('Password must contain a digit.'),
  body('branch')
    .isString().withMessage('Branch is required.').bail()
    .trim().notEmpty().withMessage('Branch is required.'),
  body('semester')
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8.')
    .toInt(),
];

const loginRules = [
  body('email')
    .isString().withMessage('Email is required.').bail()
    .trim().isEmail().withMessage('Enter a valid email address.'),
  body('password')
    .isString().withMessage('Password is required.').bail()
    .notEmpty().withMessage('Password is required.'),
];

router.post('/register', authLimiter, registerRules, validate, authController.register); // FR-01
router.post('/login', authLimiter, loginRules, validate, authController.login); // FR-02
router.get('/me', authenticate, authController.me); // FR-02

module.exports = router;
