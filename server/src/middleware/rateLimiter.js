const rateLimit = require('express-rate-limit');

/**
 * Throttles login/registration attempts to slow down brute-force attacks (SAD 3.9).
 * Returns 429 TOO_MANY_REQUESTS in the standard error format.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many attempts. Please wait a few minutes and try again.',
        details: [],
      },
    });
  },
});

module.exports = { authLimiter };
