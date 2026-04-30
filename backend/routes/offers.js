/**
 * FILE: backend/routes/offers.js  [v4 — Cloudinary image upload]
 * Stores Cloudinary secure_url (or local path) as image_url
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const multer = require("multer");

let cloudinary, CloudinaryStorage;
try {
  cloudinary = require("cloudinary").v2;
  const pkg = require("multer-storage-cloudinary");
  CloudinaryStorage = pkg.CloudinaryStorage;
} catch (_) {}

function isCloudinaryReady() {
  return (
    cloudinary &&
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function makeImageUploader() {
  if (isCloudinaryReady()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "lonaz-luxe/offers",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
    });
    return multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
  }
  const path = require("path");
  const fs = require("fs");
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "../uploads/offers");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
  return multer({ storage: diskStorage, limits: { fileSize: 5 * 1024 * 1024 } });
}

// GET /api/offers  — public active offers
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM offers
       WHERE is_active=TRUE AND (expiry_date IS NULL OR expiry_date > NOW())
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/offers/all — admin (all including expired)
router.get("/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM offers ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/offers — multipart (image optional)
router.post("/", authenticate, requireAdmin, (req, res) => {
  const upload = makeImageUploader();
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { title, description, discount, expiry_date } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });

    const image_url =
      req.file
        ? req.file.path ||
          `${process.env.BACKEND_URL || ""}/uploads/offers/${req.file.filename}`
        : req.body.image_url || null;

    try {
      const { rows } = await db.query(
        `INSERT INTO offers (title,description,discount,image_url,expiry_date)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [title, description, discount || 0, image_url, expiry_date || null]
      );
      res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

// PATCH /api/offers/:id
router.patch("/:id", authenticate, requireAdmin, (req, res) => {
  const upload = makeImageUploader();
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { title, description, discount, expiry_date, is_active } = req.body;

    const image_url = req.file
      ? req.file.path ||
        `${process.env.BACKEND_URL || ""}/uploads/offers/${req.file.filename}`
      : req.body.image_url;

    try {
      const { rows } = await db.query(
        `UPDATE offers SET
           title=COALESCE($1,title), description=COALESCE($2,description),
           discount=COALESCE($3,discount), image_url=COALESCE($4,image_url),
           expiry_date=COALESCE($5,expiry_date), is_active=COALESCE($6,is_active)
         WHERE id=$7 RETURNING *`,
        [title, description, discount, image_url, expiry_date, is_active, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

// DELETE /api/offers/:id
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE offers SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
