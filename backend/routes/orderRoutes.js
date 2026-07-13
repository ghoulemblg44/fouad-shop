const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");
const asyncHandler = require("../middleware/asyncHandler");
const { protect } = require("../middleware/auth");

// Public - customers place orders at checkout
router.post("/", asyncHandler(createOrder));

// Protected - admin manages orders
router.get("/", protect, asyncHandler(getOrders));
router.get("/:id", protect, asyncHandler(getOrderById));
router.patch("/:id/status", protect, asyncHandler(updateOrderStatus));
router.delete("/:id", protect, asyncHandler(deleteOrder));

module.exports = router;
