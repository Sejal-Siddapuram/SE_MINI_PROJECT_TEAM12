const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const AppError = require('../utils/AppError');
const { isTokenRevoked } = require('../services/authService');

/**
 * Auth middleware (FR-02, SR-04, SAD 3.4).
 * Reads "Authorization: Bearer <token>", verifies signature and expiry,
 * rejects tokens that were logged out, and attaches { id, role, name } to req.user.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.'));
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Your session has expired. Please log in again.'));
  }

  try {
    if (await isTokenRevoked(payload.jti)) {
      return next(new AppError(401, 'UNAUTHORIZED', 'You have logged out. Please log in again.'));
    }
  } catch (err) {
    return next(err);
  }

  req.user = { id: payload.sub, role: payload.role, name: payload.name, jti: payload.jti, exp: payload.exp };
  return next();
}

module.exports = authenticate;
