const Order = require("../models/Order");
const { parsePagination } = require("../utils/validators");

/**
 * GET /api/customers (protected)
 * There is no separate Customer collection - customers are derived by
 * grouping Orders by phone number, which is the one field every order
 * reliably has. Returns aggregated stats per customer.
 */
const getCustomers = async (req, res) => {
  const { page, limit } = req.query;
  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });

  const pipeline = [
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$customer.phone",
        name: { $first: "$customer.name" },
        phone: { $first: "$customer.phone" },
        wilaya: { $first: "$customer.wilaya" },
        address: { $first: "$customer.address" },
        totalOrders: { $sum: 1 },
        totalSpent: {
          $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, "$totalPrice", 0] },
        },
        lastOrderDate: { $max: "$createdAt" },
      },
    },
    { $sort: { lastOrderDate: -1 } },
  ];

  const [rows, countResult] = await Promise.all([
    Order.aggregate([...pipeline, { $skip: skip }, { $limit: limitNum }]),
    Order.aggregate([...pipeline, { $count: "total" }]),
  ]);

  const totalCount = countResult[0]?.total || 0;

  res.json({
    customers: rows,
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / limitNum) || 1,
    totalCount,
  });
};

module.exports = { getCustomers };
