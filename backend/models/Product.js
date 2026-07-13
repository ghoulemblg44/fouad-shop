const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [120, "Product name cannot exceed 120 characters"],
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    // Kept for backward compatibility with the existing frontend, which
    // stores either a plain filename (e.g. "jordan.jpg") or a full URL.
    image: {
      type: String,
      required: [true, "Product image is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },

    // --- New optional fields below. All have safe defaults so existing
    // documents created by the old schema keep working without migration. ---
    category: {
      type: String,
      trim: true,
      default: "Uncategorized",
    },

    sizes: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      min: 0,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Supports the "search" feature (?search=hoodie) with a real text index
// instead of slow, unindexed regex scans on large catalogs.
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
