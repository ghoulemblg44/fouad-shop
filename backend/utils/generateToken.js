const jwt = require("jsonwebtoken");

/**
 * Signs a JWT for an admin user. Keeping the payload minimal (id + role)
 * so the token stays small and we don't leak unnecessary data if decoded.
 */
function generateToken(admin) {
  return jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

module.exports = generateToken;
