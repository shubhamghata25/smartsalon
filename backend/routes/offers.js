/**
 * FILE: backend/routes/offers.js  [UPDATED]
 * Adds: expiry_date, is_active filter, auto-expire inactive
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const multer = require("multer");
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
const upload = multer({ storage: diskStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/offers — public, active + not expired
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM offers
      WHERE is_active=TRUE
        AND (expiry_date IS NULL OR expiry_date > NOW())
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/offers/all — admin: all offers including inactive/expired
router.get("/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM offers ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/offers (admin)
router.post("/", authenticate, requireAdmin, upload.single("image"), async (req, res) => {
  const { title, description, discount, expiry_date } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  try {
    let imageUrl = req.body.image_url || null;
    if (req.file) imageUrl = `/uploads/offers/${req.file.filename}`;
    const { rows } = await db.query(
      `INSERT INTO offers (title,description,discount,image_url,expiry_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, description, discount, imageUrl, expiry_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/offers/:id (admin)
router.patch("/:id", authenticate, requireAdmin, upload.single("image"), async (req, res) => {
  const { title, description, discount, expiry_date, is_active } = req.body;
  try {
    let imageUrl = req.body.image_url;
    if (req.file) imageUrl = `/uploads/offers/${req.file.filename}`;
    const { rows } = await db.query(
      `UPDATE offers SET
         title=COALESCE($1,title), description=COALESCE($2,description),
         discount=COALESCE($3,discount), image_url=COALESCE($4,image_url),
         expiry_date=COALESCE($5,expiry_date), is_active=COALESCE($6,is_active),
         updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title, description, discount, imageUrl, expiry_date, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/offers/:id
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE offers SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Offer removed" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
