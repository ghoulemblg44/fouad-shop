const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const {
  isValidObjectId,
  isNonEmptyString,
  parsePagination,
} = require("../utils/validators");
const { getOrCreateSettings } = require("../models/Settings");

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

/**
 * POST /api/orders (public - customers place orders at checkout)
 *
 * We deliberately recompute totalPrice on the server from the submitted
 * items instead of trusting a client-sent total - otherwise a malicious
 * client could submit { totalPrice: 1 } with expensive items in the cart.
 */
const createOrder = async (req, res) => {
  const { customer, items, deliveryNotes, paymentMethod } = req.body;

  if (
    !customer ||
    !isNonEmptyString(customer.name) ||
    !isNonEmptyString(customer.phone) ||
    !isNonEmptyString(customer.wilaya) ||
    !isNonEmptyString(customer.address)
  ) {
    throw new ApiError(400, "Full name, phone, wilaya and address are required");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Order must contain at least one item");
  }

  const cleanItems = items.map((item, index) => {
    if (!isNonEmptyString(item.name) || typeof item.price !== "number" || item.price < 0) {
      throw new ApiError(400, `Invalid item at position ${index + 1}`);
    }
    return {
      product: isValidObjectId(item.product) ? item.product : undefined,
      name: item.name.trim(),
      price: item.price,
      quantity: Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1,
      size: String(item.size ?? item.selectedSize ?? "").trim(),
      image: item.image ? String(item.image).trim() : "",
    };
  });

  const settings = await getOrCreateSettings();
  const deliveryPrice = Number.isFinite(settings.deliveryPrice) ? settings.deliveryPrice : 0;

  const itemsTotal = cleanItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPrice = itemsTotal + deliveryPrice;

  const order = await Order.create({
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      wilaya: customer.wilaya.trim(),
      address: customer.address.trim(),
    },
    items: cleanItems,
    deliveryNotes: deliveryNotes ? String(deliveryNotes).trim() : "",
    deliveryPrice,
    paymentMethod: paymentMethod === "card" ? "card" : "cod",
    totalPrice,
  });

  // The order is saved directly to MongoDB - no WhatsApp redirect, no
  // email step. The storefront shows a confirmation message on success.
  res.status(201).json({ order });
};

/**
 * GET /api/orders (protected) - supports pagination, status filter, sorting by date
 */
const getOrders = async (req, res) => {
  const { status, page, limit, search } = req.query;

  const filter = {};
  if (VALID_STATUSES.includes(status)) {
    filter.status = status;
  }
  if (isNonEmptyString(search)) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ "customer.name": re }, { "customer.phone": re }];
  }

  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });

  const [orders, totalCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders,
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / limitNum) || 1,
    totalCount,
  });
};

/**
 * GET /api/orders/:id (protected)
 */
const getOrderById = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid order id");

  const order = await Order.findById(id).lean();
  if (!order) throw new ApiError(404, "Order not found");

  res.json(order);
};

/**
 * PATCH /api/orders/:id/status (protected)
 */
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid order id");
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const order = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!order) throw new ApiError(404, "Order not found");

  res.json(order);
};

/**
 * DELETE /api/orders/:id (protected)
 */
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid order id");

  const order = await Order.findByIdAndDelete(id);
  if (!order) throw new ApiError(404, "Order not found");

  res.json({ message: "Order deleted successfully" });
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, deleteOrder };
