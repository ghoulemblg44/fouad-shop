/**
 * Wraps an async route handler so any rejected promise / thrown error
 * is automatically forwarded to Express's error-handling middleware.
 * This removes the need for try/catch in every single controller.
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
