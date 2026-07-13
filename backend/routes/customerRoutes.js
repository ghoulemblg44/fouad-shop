const express = require("express");
const router = express.Router();

const { getCustomers } = require("../controllers/customerController");
const asyncHandler = require("../middleware/asyncHandler");
const { protect } = require("../middleware/auth");

router.get("/", protect, asyncHandler(getCustomers));

module.exports = router;
