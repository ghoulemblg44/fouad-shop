const cloudinary = require("cloudinary").v2;

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    "⚠️  Cloudinary is not configured (missing CLOUDINARY_* env vars). " +
      "Image uploads will fall back to local disk storage, which does NOT " +
      "survive redeploys on Render. Add Cloudinary credentials to .env for " +
      "production use."
  );
}

module.exports = { cloudinary, isConfigured };
