const AppError = require('../utils/AppError');

/**
 * Role-based access control middleware (FR-02, SR-03).
 * Usage: router.get('/x', authenticate, authorize('Recruiter'), handler)
 * Always used on the server, so hiding a button in the UI is never the only protection.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    }
    return next();
  };
}

module.exports = authorize;
