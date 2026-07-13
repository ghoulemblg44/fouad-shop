const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const {
  deleteStoredImage,
  verifyProductImages,
  validateImageForSave,
} = require("../utils/imageStorage");
const {
  isValidObjectId,
  isNonEmptyString,
  isPositiveNumber,
  parsePagination,
} = require("../utils/validators");

/**
 * GET /api/products
 *
 * Supports optional query params:
 *   - search    (text search on name/description)
 *   - category  (exact match)
 *   - minPrice / maxPrice
 *   - sortBy    (name|price|createdAt), order (asc|desc)
 *   - page / limit (pagination)
 *
 * IMPORTANT (compatibility note): the existing frontend (script.js, admin.js)
 * calls GET /api/products with NO query params and expects a plain array
 * back (it calls .forEach directly on the response). To avoid breaking it,
 * we only return the "paginated object" shape when the caller explicitly
 * asks for pagination via ?page or ?limit. Otherwise we return a plain array,
 * exactly like the original API did.
 */
const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, sortBy, order, page, limit, featured } = req.query;

  const filter = {};

  if (isNonEmptyString(search)) {
    filter.$text = { $search: search };
  }

  if (isNonEmptyString(category) && category !== "all") {
    filter.category = new RegExp(`^${category}$`, "i");
  }

  if (featured === "true") {
    filter.isFeatured = true;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (isPositiveNumber(minPrice)) filter.price.$gte = Number(minPrice);
    if (isPositiveNumber(maxPrice)) filter.price.$lte = Number(maxPrice);
  }

  const sortField = ["name", "price", "createdAt"].includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const wantsPagination = page !== undefined || limit !== undefined;

  if (!wantsPagination) {
    // Backward-compatible path: plain array, no metadata wrapper.
    const products = await Product.find(filter).sort(sort).lean();
    return res.json(verifyProductImages(products));
  }

  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });

  const [products, totalCount] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    products: verifyProductImages(products),
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / limitNum) || 1,
    totalCount,
  });
};

/**
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid product id");
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json(verifyProductImages(product));
};

/**
 * POST /api/products (protected)
 */
const createProduct = async (req, res) => {
  const { name, price, image, description } = req.body;

  if (!isNonEmptyString(name)) throw new ApiError(400, "Product name is required");
  if (!isPositiveNumber(price)) throw new ApiError(400, "Price must be a positive number");
  if (!isNonEmptyString(image)) throw new ApiError(400, "Product image is required");
  if (!isNonEmptyString(description)) throw new ApiError(400, "Product description is required");

  const normalizedImage = validateImageForSave(image);
  if (!normalizedImage) {
    throw new ApiError(400, "Image upload failed or file not found. Please upload the image again.");
  }

  const product = await Product.create({
    name: name.trim(),
    price: Number(price),
    image: normalizedImage,
    description: description.trim(),
    category: req.body.category,
    sizes: req.body.sizes,
    stock: req.body.stock,
    isFeatured: req.body.isFeatured,
  });

  res.status(201).json(verifyProductImages(product.toObject()));
};

/**
 * PUT /api/products/:id (protected)
 */
const updateProduct = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid product id");
  }

  // Only validate fields that were actually sent (partial updates allowed).
  if (req.body.name !== undefined && !isNonEmptyString(req.body.name)) {
    throw new ApiError(400, "Product name cannot be empty");
  }
  if (req.body.price !== undefined && !isPositiveNumber(req.body.price)) {
    throw new ApiError(400, "Price must be a positive number");
  }
  if (req.body.image !== undefined && !isNonEmptyString(req.body.image)) {
    throw new ApiError(400, "Product image cannot be empty");
  }
  if (req.body.description !== undefined && !isNonEmptyString(req.body.description)) {
    throw new ApiError(400, "Product description cannot be empty");
  }

  // Grab the previous image BEFORE updating so we know what to clean up
  // if the image is being replaced.
  const previousProduct = await Product.findById(id).select("image").lean();
  if (!previousProduct) {
    throw new ApiError(404, "Product not found");
  }

  if (req.body.image !== undefined) {
    const normalizedImage = validateImageForSave(req.body.image);
    if (!normalizedImage) {
      throw new ApiError(400, "Image upload failed or file not found. Please upload the image again.");
    }
    req.body.image = normalizedImage;
  }

  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // If the image changed, delete the old one from storage (Cloudinary or
  // local disk) now that the new one is safely saved. Best-effort: never
  // lets a cleanup failure affect the response to the admin.
  if (
    req.body.image !== undefined &&
    previousProduct.image &&
    previousProduct.image !== product.image
  ) {
    deleteStoredImage(previousProduct.image);
  }

  res.json(verifyProductImages(product.toObject()));
};

/**
 * DELETE /api/products/:id (protected)
 */
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid product id");
  }

  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Clean up the product's image from storage now that the product itself
  // is gone. Best-effort - the product is already deleted either way.
  deleteStoredImage(product.image);

  res.json({ message: "Product deleted successfully" });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
