const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const ApiError = require("../utils/ApiError");
const Admin = require("../models/Admin");

/**
 * Protects a route: requires a valid "Authorization: Bearer <token>" header.
 * On success, attaches the authenticated admin (without password) to req.admin.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Let the central error handler translate JsonWebTokenError / TokenExpiredError
    throw err;
  }

  const admin = await Admin.findById(decoded.id).select("-password");
  if (!admin) {
    throw new ApiError(401, "Not authorized, admin no longer exists");
  }

  req.admin = admin;
  next();
});

module.exports = { protect };
