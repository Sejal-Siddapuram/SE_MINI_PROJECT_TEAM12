const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Auth middleware (FR-02, SAD 3.4).
 * Reads "Authorization: Bearer <token>", verifies signature and expiry,
 * and attaches { id, role, name } to req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    return next();
  } catch (err) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Your session has expired. Please log in again.'));
  }
}

module.exports = authenticate;
