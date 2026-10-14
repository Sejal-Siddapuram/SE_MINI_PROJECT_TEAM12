const AppError = require('../utils/AppError');

/** 404 for any /api route that does not exist */
function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found.`));
}

/**
 * Central error handler (SAD Section 4.4).
 * Every failed request returns the same JSON shape:
 * { success: false, error: { code, message, details } }
 * Stack traces are logged on the server only, never sent to the client.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof AppError)) {
    if (err.type === 'entity.parse.failed') {
      error = new AppError(400, 'VALIDATION_ERROR', 'Request body is not valid JSON.');
    } else if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
      error = new AppError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', details);
    } else if (err.name === 'CastError') {
      error = new AppError(404, 'NOT_FOUND', 'The requested item was not found.');
    } else if (err.code === 11000) {
      error = new AppError(409, 'DUPLICATE', 'A record with these details already exists.');
    } else {
      console.error('[error]', err);
      error = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again later.');
    }
  }

  res.status(error.status).json({
    success: false,
    error: { code: error.code, message: error.message, details: error.details || [] },
  });
}

module.exports = { notFound, errorHandler };
