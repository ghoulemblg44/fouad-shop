const express = require("express");
const router = express.Router();

const { uploadImage, deleteImage } = require("../controllers/uploadController");
const asyncHandler = require("../middleware/asyncHandler");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/", protect, upload.single("image"), asyncHandler(uploadImage));
router.delete("/:publicId", protect, asyncHandler(deleteImage));

module.exports = router;
