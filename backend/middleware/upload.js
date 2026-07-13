const multer = require("multer");
const ApiError = require("../utils/ApiError");

// We keep the file in memory (not on disk) because it may go straight to
// Cloudinary. The local-disk fallback (see uploadController.js) writes the
// buffer to disk itself when Cloudinary isn't configured.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, WEBP or GIF images are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
