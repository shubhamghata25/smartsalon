/**
 * FILE: backend/routes/subservices.js  [NEW]
 * Sub-services under a parent service (e.g. Haircut → Layer Cut, Styling)
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

// GET /api/sub-services?service_id=UUID — public
router.get("/", async (req, res) => {
  const { service_id } = req.query;
  if (!service_id) return res.status(400).json({ error: "service_id required" });
  try {
    const { rows } = await db.query(
      "SELECT * FROM sub_services WHERE service_id=$1 AND is_active=TRUE ORDER BY created_at",
      [service_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/sub-services/all — admin: all sub-services with parent name
router.get("/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ss.*, s.name AS service_name
       FROM sub_services ss
       JOIN services s ON ss.service_id=s.id
       ORDER BY s.name, ss.name`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/sub-services (admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { service_id, name, price, duration } = req.body;
  if (!service_id || !name || !price) return res.status(400).json({ error: "service_id, name, price required" });
  try {
    const { rows } = await db.query(
      "INSERT INTO sub_services (service_id,name,price,duration) VALUES ($1,$2,$3,$4) RETURNING *",
      [service_id, name, price, duration || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/sub-services/:id (admin)
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const { name, price, duration, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE sub_services SET
         name=COALESCE($1,name), price=COALESCE($2,price),
         duration=COALESCE($3,duration), is_active=COALESCE($4,is_active)
       WHERE id=$5 RETURNING *`,
      [name, price, duration, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/sub-services/:id (admin — soft delete)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE sub_services SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Sub-service removed" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
