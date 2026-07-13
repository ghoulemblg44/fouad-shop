const Admin = require("../models/Admin");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const { isNonEmptyString } = require("../utils/validators");

/**
 * POST /api/auth/login
 * Public route. There is intentionally no public "register" route -
 * admin accounts are created via the seed script (backend/seed/createAdmin.js)
 * so random visitors can never create themselves an admin account.
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    throw new ApiError(400, "Username and password are required");
  }

  // .select("+password") because the schema hides password by default.
  const admin = await Admin.findOne({ username: username.trim().toLowerCase() }).select(
    "+password"
  );

  // Same error message for "no user" and "wrong password" - don't reveal
  // whether a username exists.
  if (!admin || !(await admin.matchPassword(password))) {
    throw new ApiError(401, "Invalid username or password");
  }

  const token = generateToken(admin);

  res.json({
    token,
    admin: {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    },
  });
};

/**
 * GET /api/auth/me (protected)
 * Lets the frontend verify a stored token is still valid and fetch
 * the current admin's info.
 */
const getMe = async (req, res) => {
  res.json({ admin: req.admin });
};

module.exports = { login, getMe };
