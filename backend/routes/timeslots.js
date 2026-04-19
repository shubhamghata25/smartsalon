const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM time_slot_configs ORDER BY slot_time");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { slot_time } = req.body;
  try {
    const { rows } = await db.query(
      "INSERT INTO time_slot_configs (slot_time) VALUES ($1) RETURNING *", [slot_time]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const { is_active } = req.body;
  try {
    const { rows } = await db.query(
      "UPDATE time_slot_configs SET is_active=$1 WHERE id=$2 RETURNING *",
      [is_active, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM time_slot_configs WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
