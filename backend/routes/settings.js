/**
 * FILE: backend/routes/settings.js  [v4]
 * - Logo upload uses Cloudinary (falls back to disk)
 * - New endpoints: GET/POST /api/settings/hero-media
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const multer = require("multer");

// ── Cloudinary helper ─────────────────────────────────────────────────────────
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

function makeUploader(folder, resourceType = "image") {
  if (isCloudinaryReady()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        resource_type: resourceType,
        allowed_formats:
          resourceType === "video"
            ? ["mp4", "mov", "webm"]
            : ["jpg", "jpeg", "png", "webp"],
      },
    });
    return multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });
  }
  // Local fallback
  const path = require("path");
  const fs = require("fs");
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
  return multer({ storage: diskStorage, limits: { fileSize: 20 * 1024 * 1024 } });
}

// ── GET /api/settings ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT key, value FROM admin_settings");
    const settings = {};
    rows.forEach((r) => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH /api/settings ───────────────────────────────────────────────────────
router.patch("/", authenticate, requireAdmin, async (req, res) => {
  const allowed = [
    "salon_name", "upi_id", "whatsapp_number",
    "footer_tagline", "footer_address", "footer_phone",
    "footer_email", "instagram_url",
  ];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length)
    return res.status(400).json({ error: "No valid settings provided" });

  try {
    for (const [key, value] of updates) {
      await db.query(
        `INSERT INTO admin_settings (key,value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
        [key, value]
      );
    }
    const { rows } = await db.query("SELECT key, value FROM admin_settings");
    const settings = {};
    rows.forEach((r) => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/settings/logo ───────────────────────────────────────────────────
router.post(
  "/logo",
  authenticate,
  requireAdmin,
  (req, res, next) => {
    const upload = makeUploader("lonaz-luxe/settings");
    upload.single("logo")(req, res, next);
  },
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Logo file required" });
    try {
      // Cloudinary returns .path as secure_url; disk returns .filename
      const logoUrl =
        req.file.path ||
        `${process.env.BACKEND_URL || ""}/uploads/lonaz-luxe/settings/${req.file.filename}`;

      await db.query(
        `INSERT INTO admin_settings (key,value) VALUES ('logo_url',$1)
         ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
        [logoUrl]
      );
      res.json({ logo_url: logoUrl });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── GET /api/settings/hero-media ──────────────────────────────────────────────
router.get("/hero-media", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM hero_media WHERE is_active=TRUE ORDER BY created_at DESC LIMIT 1"
    );
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/settings/hero-media ─────────────────────────────────────────────
router.post(
  "/hero-media",
  authenticate,
  requireAdmin,
  (req, res, next) => {
    // Detect resource type from incoming form field or fallback to image
    const resourceType = req.query.type === "video" ? "video" : "image";
    req._heroType = resourceType;
    const upload = makeUploader("lonaz-luxe/hero", resourceType);
    upload.single("file")(req, res, next);
  },
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "File required" });

    const type = req._heroType || "image";
    const url =
      req.file.path ||
      `${process.env.BACKEND_URL || ""}/uploads/lonaz-luxe/hero/${req.file.filename}`;

    try {
      // Deactivate previous hero media
      await db.query("UPDATE hero_media SET is_active=FALSE");

      const { rows } = await db.query(
        "INSERT INTO hero_media (type, url, is_active) VALUES ($1,$2,TRUE) RETURNING *",
        [type, url]
      );

      // Also persist in admin_settings for easy reads
      await db.query(
        `INSERT INTO admin_settings (key,value) VALUES ('hero_media_url',$1)
         ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
        [url]
      );
      await db.query(
        `INSERT INTO admin_settings (key,value) VALUES ('hero_media_type',$1)
         ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
        [type]
      );

      res.json(rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── DELETE /api/settings/hero-media (reset to animated canvas) ────────────────
router.delete("/hero-media", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE hero_media SET is_active=FALSE");
    await db.query(
      `INSERT INTO admin_settings (key,value) VALUES ('hero_media_url','')
       ON CONFLICT (key) DO UPDATE SET value='', updated_at=NOW()`
    );
    res.json({ message: "Hero media cleared" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
