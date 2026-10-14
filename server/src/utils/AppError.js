/**
 * Typed application error (SAD Section 4.4).
 * Services throw these; the central error handler turns them into
 * { success: false, error: { code, message, details } } responses.
 */
class AppError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = AppError;
