const express = require("express");
const router = express.Router();

const { getStats, getStatistics } = require("../controllers/dashboardController");
const asyncHandler = require("../middleware/asyncHandler");
const { protect } = require("../middleware/auth");

router.get("/stats", protect, asyncHandler(getStats));
router.get("/statistics", protect, asyncHandler(getStatistics));

module.exports = router;
