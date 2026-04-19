/**
 * FILE: backend/routes/categories.js  [NEW]
 * 3-level structure: Category → Service → Sub-Service
 * e.g. Men → Haircut → Fade Cut
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

// GET /api/categories — public, with optional nested services
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM categories WHERE is_active=TRUE ORDER BY sort_order, created_at"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/categories/:id/services — category with all its services
router.get("/:id/services", async (req, res) => {
  try {
    const { rows: cat } = await db.query("SELECT * FROM categories WHERE id=$1", [req.params.id]);
    if (!cat.length) return res.status(404).json({ error: "Category not found" });
    const { rows: svcs } = await db.query(
      "SELECT * FROM services WHERE category_id=$1 AND is_active=TRUE ORDER BY sort_order, created_at",
      [req.params.id]
    );
    res.json({ category: cat[0], services: svcs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/categories (admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { name, description, image_url, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const { rows } = await db.query(
      "INSERT INTO categories (name,description,image_url,sort_order) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, description, image_url || null, sort_order || 0]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/categories/:id (admin)
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const { name, description, image_url, sort_order, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE categories SET
         name=COALESCE($1,name), description=COALESCE($2,description),
         image_url=COALESCE($3,image_url), sort_order=COALESCE($4,sort_order),
         is_active=COALESCE($5,is_active)
       WHERE id=$6 RETURNING *`,
      [name, description, image_url, sort_order, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/categories/:id (soft delete)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE categories SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Category removed" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
