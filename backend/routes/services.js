const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// GET /api/services
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM services WHERE is_active=TRUE ORDER BY created_at");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/services/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM services WHERE id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Service not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/services (admin)
router.post("/", authenticate, requireAdmin, [
  body("name").trim().notEmpty(),
  body("price").isNumeric(),
  body("duration").isInt({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, description, price, duration, icon, category } = req.body;
    const { rows } = await db.query(
      "INSERT INTO services (name,description,price,duration,icon,category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [name, description, price, duration, icon, category]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/services/:id (admin)
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, duration, icon, category, is_active } = req.body;
    const { rows } = await db.query(
      `UPDATE services SET name=COALESCE($1,name), description=COALESCE($2,description),
       price=COALESCE($3,price), duration=COALESCE($4,duration), icon=COALESCE($5,icon),
       category=COALESCE($6,category), is_active=COALESCE($7,is_active)
       WHERE id=$8 RETURNING *`,
      [name, description, price, duration, icon, category, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/services/:id (admin – soft delete)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE services SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Service deactivated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
