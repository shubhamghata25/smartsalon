/**
 * FILE: backend/routes/services.js  [UPDATED]
 * Now supports category_id for 3-level structure
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

// GET /api/services
router.get("/", async (req, res) => {
  try {
    const { category_id } = req.query;
    let q = `SELECT s.*, c.name AS category_name FROM services s
             LEFT JOIN categories c ON s.category_id=c.id
             WHERE s.is_active=TRUE`;
    const params = [];
    if (category_id) { q += ` AND s.category_id=$1`; params.push(category_id); }
    q += " ORDER BY s.sort_order, s.created_at";
    const { rows } = await db.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/services/:id — with sub-services
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, c.name AS category_name FROM services s
       LEFT JOIN categories c ON s.category_id=c.id WHERE s.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const { rows: subs } = await db.query(
      "SELECT * FROM sub_services WHERE service_id=$1 AND is_active=TRUE ORDER BY sort_order, created_at",
      [req.params.id]
    );
    res.json({ ...rows[0], sub_services: subs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/services (admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { name, description, price, price_min, price_max, duration, slot_duration, icon, category, category_id, image_url, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const { rows } = await db.query(
      `INSERT INTO services (name,description,price,price_min,price_max,duration,slot_duration,icon,category,category_id,image_url,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, description, price||0, price_min||null, price_max||null, duration||30, slot_duration||30, icon, category, category_id||null, image_url||null, sort_order||0]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/services/:id (admin)
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const { name, description, price, price_min, price_max, duration, slot_duration, icon, category, category_id, image_url, sort_order, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE services SET
         name=COALESCE($1,name), description=COALESCE($2,description),
         price=COALESCE($3,price), price_min=COALESCE($4,price_min), price_max=COALESCE($5,price_max),
         duration=COALESCE($6,duration), slot_duration=COALESCE($7,slot_duration),
         icon=COALESCE($8,icon), category=COALESCE($9,category),
         category_id=COALESCE($10,category_id), image_url=COALESCE($11,image_url),
         sort_order=COALESCE($12,sort_order), is_active=COALESCE($13,is_active)
       WHERE id=$14 RETURNING *`,
      [name, description, price, price_min, price_max, duration, slot_duration, icon, category, category_id, image_url, sort_order, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/services/:id (soft delete)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE services SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Deactivated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
