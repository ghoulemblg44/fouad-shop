const express = require("express");
const router = express.Router();

const { getSettings, updateSettings } = require("../controllers/settingsController");
const asyncHandler = require("../middleware/asyncHandler");
const { protect } = require("../middleware/auth");

router.get("/", asyncHandler(getSettings));
router.put("/", protect, asyncHandler(updateSettings));

module.exports = router;
