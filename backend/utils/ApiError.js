/**
 * Standardized error class used across the app.
 * Lets controllers do: throw new ApiError(404, "Product not found")
 * and have the central error handler turn it into clean JSON.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // optional array of field-level validation errors
    this.isOperational = true; // distinguishes "expected" errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
