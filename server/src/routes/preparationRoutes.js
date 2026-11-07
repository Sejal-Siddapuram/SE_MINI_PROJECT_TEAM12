const router = require('express').Router();
const { param, body } = require('express-validator');
const controller = require('../controllers/preparationController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const ROLES = require('../utils/roles');

router.use(authenticate, authorize(ROLES.STUDENT));
router.get('/tests', controller.listTests);
router.get('/tests/attempts', controller.listAttempts);
router.get('/interview', controller.getInterviewContent);
router.get('/tests/:id', param('id').isMongoId(), validate, controller.getTest);
router.post('/tests/:id/submit', param('id').isMongoId(), body('answers').isArray({ max: 1000 }),
  validate, controller.submitTest);
module.exports = router;
