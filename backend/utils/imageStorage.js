const fs = require("fs");
const path = require("path");
const { cloudinary, isConfigured } = require("../config/cloudinary");

const LOCAL_UPLOAD_DIR = path.join(__dirname, "..", "uploads");

/**
 * Extracts the Cloudinary public_id from a secure_url, e.g.
 *   https://res.cloudinary.com/demo/image/upload/v1699999999/fouadshop/products/abc123.jpg
 *   -> "fouadshop/products/abc123"
 */
function extractCloudinaryPublicId(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

/**
 * Best-effort deletion of a previously uploaded product/settings image,
 * whether it lives on Cloudinary or on local disk. Silently does nothing
 * for:
 *   - empty/missing values
 *   - bundled static assets (e.g. "tshirt.jpg", "images/jordan.jpg") which
 *     ship with the repo and must never be deleted
 *   - any other external URL we don't manage (e.g. a placeholder image)
 *
 * Never throws - image cleanup should never break a product create/update/
 * delete request, it's just housekeeping.
 */
function isLocalUploadPath(imageValue) {
  if (!imageValue || typeof imageValue !== "string") return false;
  return imageValue.trim().replace(/\\/g, "/").replace(/^\/+/, "").startsWith("uploads/");
}

/**
 * Normalizes a stored image path before saving to MongoDB.
 * Local uploads are always stored as "/uploads/filename.ext".
 */
function normalizeImagePath(imageValue) {
  if (!imageValue || typeof imageValue !== "string") return "";

  const img = imageValue.trim().replace(/\\/g, "/");
  if (!img) return "";

  if (/^https?:\/\//i.test(img)) return img;

  if (isLocalUploadPath(img)) {
    return `/uploads/${path.basename(img)}`;
  }

  // Legacy static asset: bare filename or images/foo.jpg
  const stripped = img.replace(/^\/+/, "");
  if (/^images\//i.test(stripped)) return stripped;
  if (!stripped.includes("/")) return stripped;
  return stripped;
}

/**
 * Returns a normalized image path safe to persist, or null if a managed
 * local upload path does not exist on disk (upload failed or file lost).
 */
function validateImageForSave(imageValue) {
  const normalized = normalizeImagePath(imageValue);
  if (!normalized) return null;

  if (isLocalUploadPath(normalized)) {
    return verifyImageValue(normalized) ? normalized : null;
  }

  return normalized;
}

async function deleteStoredImage(imageValue) {
  if (!imageValue || typeof imageValue !== "string") return;

  try {
    // Local disk upload, e.g. "/uploads/product-171234-8827.jpg" or "uploads/..."
    if (isLocalUploadPath(imageValue)) {
      const filename = path.basename(imageValue);
      const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    // Cloudinary URL
    if (/^https?:\/\//i.test(imageValue) && imageValue.includes("res.cloudinary.com")) {
      if (!isConfigured) return;
      const publicId = extractCloudinaryPublicId(imageValue);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
      return;
    }

    // Anything else (bundled static asset like "tshirt.jpg" or an
    // unrelated external URL) is intentionally left alone.
  } catch (err) {
    console.warn("⚠️  Could not delete old image (non-fatal):", err.message);
  }
}

/**
 * Verifies a single product/settings image value before it's sent to the
 * client, per the "never show a broken image" requirement:
 *   - Cloudinary / any absolute URL: trusted as-is (we don't make a network
 *     round-trip per product just to check it; Cloudinary URLs don't 404
 *     once uploaded successfully).
 *   - Local "/uploads/xyz.jpg": we DO control this disk, so we check the
 *     file actually exists. If it was lost (e.g. wiped on redeploy, or a
 *     failed write that slipped through), we return "" instead of a path
 *     that would 404 - the frontend's onerror fallback then shows the
 *     placeholder immediately instead of a broken-image flash.
 *   - Bundled static assets (e.g. "hoodie.jpg", "images/jordan.jpg"): these
 *     live in the frontend, not on this server, so we can't verify them
 *     here - pass through untouched. This is what keeps old products working.
 */
function verifyImageValue(imageValue) {
  if (!imageValue || typeof imageValue !== "string") return imageValue || "";

  const img = imageValue.trim().replace(/\\/g, "/");
  if (!img) return "";

  if (/^https?:\/\//i.test(img)) return img;

  if (img.replace(/^\/+/, "").startsWith("uploads/")) {
    const filename = path.basename(img);
    const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
    return fs.existsSync(filePath) ? img : "";
  }

  // Bundled static asset (old-style product) - can't verify, leave as-is.
  return img;
}

/**
 * Runs verifyImageValue over a product (or array of products) returned
 * from Mongo, without mutating the original object/lean doc in place.
 */
function verifyProductImages(productOrList) {
  if (Array.isArray(productOrList)) {
    return productOrList.map((p) => ({ ...p, image: verifyImageValue(p.image) }));
  }
  if (productOrList && typeof productOrList === "object") {
    return { ...productOrList, image: verifyImageValue(productOrList.image) };
  }
  return productOrList;
}

module.exports = {
  deleteStoredImage,
  extractCloudinaryPublicId,
  verifyProductImages,
  validateImageForSave,
  normalizeImagePath,
};
