const { getOrCreateSettings } = require("../models/Settings");
const Settings = require("../models/Settings");
const ApiError = require("../utils/ApiError");
const { isPositiveNumber } = require("../utils/validators");

/**
 * GET /api/settings (PUBLIC)
 * The storefront needs this to know the currency and
 * delivery price without hardcoding them in script.js.
 */
const getSettings = async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
};

/**
 * PUT /api/settings (protected)
 */
const updateSettings = async (req, res) => {
  const { storeName, deliveryPrice, currency, logoUrl, bannerUrl } = req.body;

  const update = {};
  if (storeName !== undefined) update.storeName = String(storeName).trim();
  if (currency !== undefined) update.currency = String(currency).trim();
  if (logoUrl !== undefined) update.logoUrl = String(logoUrl).trim();
  if (bannerUrl !== undefined) update.bannerUrl = String(bannerUrl).trim();
  if (deliveryPrice !== undefined) {
    if (!isPositiveNumber(deliveryPrice)) throw new ApiError(400, "Delivery price must be a positive number");
    update.deliveryPrice = Number(deliveryPrice);
  }

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(update);
  } else {
    settings = await Settings.findByIdAndUpdate(settings._id, update, {
      new: true,
      runValidators: true,
    });
  }

  res.json(settings);
};

module.exports = { getSettings, updateSettings };
