/**
 * FILE: backend/routes/upload.js [FIXED]
 * Uses cloudinary v1 + multer-storage-cloudinary v4 (compatible pair)
 * Falls back to local disk if Cloudinary not configured
 */
const router = require("express").Router();
const { authenticate, requireAdmin } = require("../middleware/auth");
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

let cloudinary, CloudinaryStorage;
try {
  cloudinary = require("cloudinary").v2;
  CloudinaryStorage = require("multer-storage-cloudinary").CloudinaryStorage;
} catch (e) {}

const isCloudinaryConfigured = () =>
  cloudinary &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

function getUploader(folder = "lonaz-luxe/general") {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        allowed_formats: ["jpg","jpeg","png","webp","gif","mp4","mov"],
        resource_type: "auto",
      },
    });
    return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
  }

  // Local disk fallback
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, `../uploads/${folder}`);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
  return multer({ storage: diskStorage, limits: { fileSize: 10 * 1024 * 1024 } });
}

// POST /api/upload/image
router.post("/image", authenticate, requireAdmin, (req, res) => {
  const folder = req.query.folder || "lonaz-luxe/general";
  getUploader(folder).single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = req.file.path ||
      `${process.env.BACKEND_URL || ""}/uploads/${folder}/${req.file.filename}`;
    res.json({ url, filename: req.file.filename || req.file.public_id });
  });
});

// POST /api/upload/video
router.post("/video", authenticate, requireAdmin, (req, res) => {
  const folder = req.query.folder || "lonaz-luxe/videos";
  getUploader(folder).single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = req.file.path ||
      `${process.env.BACKEND_URL || ""}/uploads/${folder}/${req.file.filename}`;
    res.json({ url, filename: req.file.filename || req.file.public_id });
  });
});

module.exports = router;
