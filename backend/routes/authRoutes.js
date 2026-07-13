const express = require("express");
const router = express.Router();

const { login, getMe } = require("../controllers/authController");
const asyncHandler = require("../middleware/asyncHandler");
const { protect } = require("../middleware/auth");

router.post("/login", asyncHandler(login));
router.get("/me", protect, asyncHandler(getMe));

module.exports = router;
