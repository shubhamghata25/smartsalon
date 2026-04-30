/**
 * FILE: backend/routes/subservices.js  [UPDATED]
 * Now includes image_url, description, sort_order
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.get("/", async (req, res) => {
  const { service_id } = req.query;
  if (!service_id) return res.status(400).json({ error: "service_id required" });
  try {
    const { rows } = await db.query(
      "SELECT * FROM sub_services WHERE service_id=$1 AND is_active=TRUE ORDER BY sort_order, created_at",
      [service_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ss.*, s.name AS service_name, c.name AS category_name
       FROM sub_services ss
       JOIN services s ON ss.service_id=s.id
       LEFT JOIN categories c ON s.category_id=c.id
       ORDER BY c.name, s.name, ss.sort_order`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { service_id, name, price, duration, description, image_url, sort_order, discount_price } = req.body;
  if (!service_id || !name || price === undefined)
    return res.status(400).json({ error: "service_id, name, price required" });
  try {
    const { rows } = await db.query(
      `INSERT INTO sub_services (service_id,name,price,duration,description,image_url,sort_order,discount_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [service_id, name, price, duration||null, description||null, image_url||null, sort_order||0, discount_price||null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const { name, price, duration, description, image_url, sort_order, is_active, discount_price } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE sub_services SET
         name=COALESCE($1,name), price=COALESCE($2,price),
         duration=COALESCE($3,duration), description=COALESCE($4,description),
         image_url=COALESCE($5,image_url), sort_order=COALESCE($6,sort_order),
         is_active=COALESCE($7,is_active), discount_price=COALESCE($8,discount_price)
       WHERE id=$9 RETURNING *`,
      [name, price, duration, description, image_url, sort_order, is_active, discount_price, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE sub_services SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Removed" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
