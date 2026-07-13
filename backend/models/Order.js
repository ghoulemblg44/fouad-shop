const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false, // optional: not every order line is tied to a live Product doc
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: [true, "Customer name is required"], trim: true },
      phone: { type: String, required: [true, "Customer phone is required"], trim: true },
      wilaya: { type: String, required: [true, "Wilaya is required"], trim: true },
      address: { type: String, required: [true, "Address is required"], trim: true },
    },

    deliveryNotes: { type: String, trim: true, default: "" },

    deliveryPrice: { type: Number, min: 0, default: 0 },

    paymentMethod: {
      type: String,
      enum: ["cod", "card"],
      default: "cod",
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "An order must contain at least one item",
      },
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
