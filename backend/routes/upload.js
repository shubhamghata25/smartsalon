/**
 * FILE: backend/routes/upload.js  [NEW]
 * Cloudinary image/video upload — returns secure URL
 * Falls back to local multer if Cloudinary not configured
 */
const router = require("express").Router();
const { authenticate, requireAdmin } = require("../middleware/auth");
const multer = require("multer");

// Try to load Cloudinary — optional dependency
let cloudinary, CloudinaryStorage;
try {
  cloudinary = require("cloudinary").v2;
  const pkg = require("multer-storage-cloudinary");
  CloudinaryStorage = pkg.CloudinaryStorage;
} catch (e) {}

const isCloudinaryConfigured = () =>
  cloudinary &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

// Build the appropriate multer instance
function getUploader(folder = "lonaz-luxe") {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const storage = new CloudinaryStorage({
      cloudinary,
      params: { folder, allowed_formats: ["jpg","jpeg","png","webp","mp4","mov"] },
    });
    return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
  }
  // Fallback: local disk
  const path = require("path");
  const fs   = require("fs");
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
  const upload = getUploader(folder);
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const url = req.file.path || // Cloudinary returns .path as secure_url
      `${process.env.BACKEND_URL || ""}/uploads/${folder}/${req.file.filename}`;
    res.json({ url, filename: req.file.filename || req.file.public_id });
  });
});

// POST /api/upload/video
router.post("/video", authenticate, requireAdmin, (req, res) => {
  const folder = req.query.folder || "lonaz-luxe/videos";
  const upload = getUploader(folder);
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = req.file.path || `${process.env.BACKEND_URL || ""}/uploads/${folder}/${req.file.filename}`;
    res.json({ url, filename: req.file.filename || req.file.public_id });
  });
});

module.exports = router;
