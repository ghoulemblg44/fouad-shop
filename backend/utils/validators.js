const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isNonEmptyString = (val) => typeof val === "string" && val.trim().length > 0;

const isPositiveNumber = (val) => {
  const num = Number(val);
  return !Number.isNaN(num) && Number.isFinite(num) && num >= 0;
};

const isValidEmail = (val) =>
  typeof val === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

/**
 * Parses & clamps pagination query params so a bad request
 * (like ?limit=999999) can't be used to dump the whole DB at once.
 */
const parsePagination = (query) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100; // hard ceiling to protect performance

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = {
  isValidObjectId,
  isNonEmptyString,
  isPositiveNumber,
  isValidEmail,
  parsePagination,
};
