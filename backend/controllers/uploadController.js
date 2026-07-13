const path = require("path");
const fs = require("fs");
const ApiError = require("../utils/ApiError");
const { cloudinary, isConfigured } = require("../config/cloudinary");

const LOCAL_UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Make sure the local uploads folder exists as soon as this module loads,
// not just lazily on first upload - guarantees express.static("/uploads")
// and multer's local fallback always have somewhere to read/write, even on
// a completely fresh checkout/container.
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

/**
 * POST /api/upload (protected)
 * Expects multipart/form-data with a single field named "image".
 *
 * Response contract (frontend depends on this exact shape - do not add or
 * rename fields here without updating admin/products.js too):
 *   200 { "imageUrl": "https://..." }         (Cloudinary configured)
 *   200 { "imageUrl": "/uploads/filename.jpg" } (local disk fallback)
 *
 * If Cloudinary is configured, the image is uploaded there and a permanent
 * HTTPS URL is returned - this is what should be used in production, since
 * Render's filesystem is ephemeral and wipes /uploads on every redeploy.
 *
 * If Cloudinary is NOT configured, we fall back to writing the file to the
 * local /backend/uploads folder (dev-only convenience) so the feature still
 * works out of the box before credentials are added.
 */
const uploadImage = async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file was uploaded");
  }

  // --- Cloudinary (production-recommended) ---
  if (isConfigured) {
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "fouadshop/products",
      resource_type: "image",
      transformation: [{ width: 1600, height: 1600, crop: "limit" }, { quality: "auto" }],
    });

    if (!result || !result.secure_url) {
      throw new ApiError(502, "Image upload to Cloudinary failed");
    }

    return res.status(200).json({ imageUrl: result.secure_url });
  }

  // --- Local disk fallback (development / no Cloudinary configured) ---
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }

  const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
  const safeExt = /^\.(jpe?g|png|webp|gif)$/i.test(ext) ? ext : ".jpg";
  const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
  const filePath = path.join(LOCAL_UPLOAD_DIR, filename);

  fs.writeFileSync(filePath, req.file.buffer);

  // Sanity check: make sure the file actually landed on disk before telling
  // the client it succeeded, so uploadedImageUrl is never set to a path
  // that 404s a moment later.
  if (!fs.existsSync(filePath)) {
    throw new ApiError(500, "Failed to save uploaded image to disk");
  }

  const imageUrl = `/uploads/${filename}`;
  return res.status(200).json({ imageUrl });
};

/**
 * DELETE /api/upload/:publicId (protected)
 * Optional cleanup hook: lets the admin UI remove an orphaned Cloudinary
 * image (e.g. user uploaded a new photo before saving the product).
 * publicId must be URL-encoded by the caller since it contains "/".
 */
const deleteImage = async (req, res) => {
  if (!isConfigured) {
    throw new ApiError(400, "Cloudinary is not configured");
  }
  const publicId = decodeURIComponent(req.params.publicId);
  await cloudinary.uploader.destroy(publicId);
  res.status(200).json({ message: "Image deleted" });
};

module.exports = { uploadImage, deleteImage };
