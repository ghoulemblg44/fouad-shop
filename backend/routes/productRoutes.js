const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const asyncHandler = require("../middleware/asyncHandler");
const { protect } = require("../middleware/auth");

// Public - anyone browsing the shop can list/view products
router.get("/", asyncHandler(getProducts));
router.get("/:id", asyncHandler(getProductById));

// Protected - only a logged-in admin can create/update/delete
router.post("/", protect, asyncHandler(createProduct));
router.put("/:id", protect, asyncHandler(updateProduct));
router.delete("/:id", protect, asyncHandler(deleteProduct));

module.exports = router;
