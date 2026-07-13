const mongoose = require("mongoose");

/**
 * Single-document collection: there is always exactly one Settings row.
 * getSettings() below creates it with sane defaults on first use so the
 * rest of the app never has to null-check "no settings yet".
 */
const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, trim: true, default: "Fouad Shop" },
    deliveryPrice: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: "DA" },
    logoUrl: { type: String, trim: true, default: "" },
    bannerUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

/**
 * Returns the single settings document, creating it with defaults
 * the first time it's requested.
 */
async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

module.exports = Settings;
module.exports.getOrCreateSettings = getOrCreateSettings;
