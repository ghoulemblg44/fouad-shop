const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI from environment variables.
 * Keeping this in its own module means server.js doesn't need to know
 * connection details, and we can reuse it in seed scripts too.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    // Fail fast with a clear message instead of a confusing mongoose error later.
    console.error("❌ MONGO_URI is not defined in your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log("✅ MongoDB Connected:", mongoose.connection.host);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
