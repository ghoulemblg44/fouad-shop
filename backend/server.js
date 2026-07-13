require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const sanitizeInputs = require("./middleware/sanitize");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

// --- Security middleware ---
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: restrict to a known origin in production via CLIENT_URL, but default
// to "*" so the existing frontend (opened as a static file / different port)
// keeps working out of the box in development.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  })
);

// Rate limiting: protects login and the wider API from brute-force / abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // generous general limit
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter on login to slow down brute-force attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again later." },
});
app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);

// --- Logging ---
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// --- Body parsing (with a sane size limit) ---
app.use(express.json({ limit: "1mb" }));

// --- Input sanitization against NoSQL injection (see middleware/sanitize.js
// for why we don't use the express-mongo-sanitize package here) ---
app.use(sanitizeInputs);

// --- Static files for uploaded product images ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- API routes ---
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/customers", customerRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Fouad Shop Backend is running!");
});

// --- 404 + centralized error handling (must be registered last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to the DB first, only start accepting requests once connected.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

// Safety net: log anything that slips past our error handling instead of
// letting the process die silently or with an ugly native stack trace.
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
});
