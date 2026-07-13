const Product = require("../models/Product");
const Order = require("../models/Order");

/**
 * GET /api/dashboard/stats (protected)
 * High-level counters for the dashboard home cards.
 */
const getStats = async (req, res) => {
  const [totalProducts, totalOrders, revenueResult, recentOrders, lowStock, statusCounts] =
    await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

  const totalRevenue = revenueResult[0]?.total || 0;
  const ordersByStatus = statusCounts.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  res.json({
    totalProducts,
    totalOrders,
    totalRevenue,
    lowStock,
    ordersByStatus,
    recentOrders,
  });
};

/**
 * GET /api/dashboard/statistics (protected)
 * Powers the Statistics page: daily sales (last 14 days), monthly sales
 * (last 12 months), top-selling products, and units sold.
 */
const getStatistics = async (req, res) => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const notCancelled = { status: { $ne: "cancelled" } };

  const [dailySales, monthlySales, topProducts, unitsSoldResult] = await Promise.all([
    Order.aggregate([
      { $match: { ...notCancelled, createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...notCancelled, createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: notCancelled },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: notCancelled },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]),
  ]);

  res.json({
    dailySales,
    monthlySales,
    topProducts,
    unitsSold: unitsSoldResult[0]?.total || 0,
  });
};

module.exports = { getStats, getStatistics };
