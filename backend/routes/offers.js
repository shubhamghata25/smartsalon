/**
 * FILE: backend/routes/offers.js  [NEW]
 * Admin-controlled dynamic offers for homepage
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const upload = require("../utils/multer");

// GET /api/offers — public, only active
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM offers WHERE is_active=TRUE ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/offers/all — admin: all including inactive
router.get("/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM offers ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/offers (admin)
router.post("/", authenticate, requireAdmin, (req, res, next) => {
  req.uploadFolder = "offers"; next();
}, upload.single("image"), async (req, res) => {
  const { title, description, discount } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  try {
    const imageUrl = req.file ? `/uploads/offers/${req.file.filename}` : req.body.image_url || null;
    const { rows } = await db.query(
      `INSERT INTO offers (title,description,discount,image_url) VALUES ($1,$2,$3,$4) RETURNING *`,
      [title, description, discount, imageUrl]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/offers/:id (admin)
router.patch("/:id", authenticate, requireAdmin, (req, res, next) => {
  req.uploadFolder = "offers"; next();
}, upload.single("image"), async (req, res) => {
  const { title, description, discount, is_active } = req.body;
  try {
    const imageUrl = req.file ? `/uploads/offers/${req.file.filename}` : req.body.image_url;
    const { rows } = await db.query(
      `UPDATE offers SET
         title=COALESCE($1,title), description=COALESCE($2,description),
         discount=COALESCE($3,discount), image_url=COALESCE($4,image_url),
         is_active=COALESCE($5,is_active), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [title, description, discount, imageUrl, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/offers/:id (admin — soft delete)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE offers SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Offer removed" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
