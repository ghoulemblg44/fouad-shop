/**
 * Creates (or updates the password of) the admin account defined by
 * ADMIN_USERNAME / ADMIN_PASSWORD in your .env file.
 *
 * Run with:   npm run seed:admin
 *
 * There is no public "/api/auth/register" route on purpose - this script
 * is the only way to create an admin, so a random visitor can never
 * create themselves an admin account through the API.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

async function run() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error("❌ Set ADMIN_USERNAME and ADMIN_PASSWORD in your .env file first.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await connectDB();

  let admin = await Admin.findOne({ username: username.toLowerCase() }).select("+password");

  if (admin) {
    admin.password = password; // pre-save hook will re-hash it
    await admin.save();
    console.log(`✅ Password updated for existing admin "${username}"`);
  } else {
    admin = await Admin.create({ username, password });
    console.log(`✅ Admin account "${username}" created`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Failed to seed admin:", err);
  process.exit(1);
});
