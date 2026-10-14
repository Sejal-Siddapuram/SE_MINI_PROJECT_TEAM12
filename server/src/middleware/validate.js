const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Runs after express-validator rules. If any rule failed, responds with
 * 400 VALIDATION_ERROR and a list of { field, message } so the UI can show
 * the message next to the right input.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(new AppError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', details));
}

module.exports = validate;
