/**
 * FILE: backend/routes/courses.js  [MODIFIED]
 *
 * Changes from v1:
 *  - GET / now returns offer_price if set
 *  - POST / and PATCH /:id accept offer_price
 *  - DELETE /:id added (soft delete via is_active=false)
 *  - All v1 enroll/access endpoints preserved unchanged
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

// GET /api/courses — public, active only, includes offer_price
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id,title,description,price,offer_price,duration_hrs,
              lesson_count,thumbnail,tag
       FROM courses WHERE is_active=TRUE ORDER BY created_at`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/courses/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM courses WHERE id=$1 AND is_active=TRUE", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const course = { ...rows[0] };
    if (!req.headers.authorization) delete course.video_url;
    res.json(course);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/courses/:id/access — enrolled users only
router.get("/:id/access", authenticate, async (req, res) => {
  try {
    const { rows: enroll } = await db.query(
      "SELECT * FROM enrollments WHERE user_id=$1 AND course_id=$2",
      [req.user.id, req.params.id]
    );
    if (!enroll.length && req.user.role !== "admin")
      return res.status(403).json({ error: "Purchase required" });
    const { rows } = await db.query("SELECT * FROM courses WHERE id=$1", [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/courses/:id/enroll
router.post("/:id/enroll", authenticate, async (req, res) => {
  const { payment_id } = req.body;
  try {
    const { rows: pay } = await db.query(
      "SELECT * FROM payments WHERE id=$1 AND status='success'", [payment_id]
    );
    if (!pay.length) return res.status(402).json({ error: "Payment not verified" });
    const { rows } = await db.query(
      `INSERT INTO enrollments (user_id,course_id,payment_id) VALUES ($1,$2,$3)
       ON CONFLICT (user_id,course_id) DO NOTHING RETURNING *`,
      [req.user.id, req.params.id, payment_id]
    );
    res.status(201).json(rows[0] || { message: "Already enrolled" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/courses (admin) — NEW: accepts offer_price
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { title, description, price, offer_price, duration_hrs, lesson_count, thumbnail, video_url, tag } = req.body;
  if (!title || !price) return res.status(400).json({ error: "title and price required" });
  try {
    const { rows } = await db.query(
      `INSERT INTO courses (title,description,price,offer_price,duration_hrs,lesson_count,thumbnail,video_url,tag)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, description, price, offer_price || null, duration_hrs, lesson_count, thumbnail, video_url, tag]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/courses/:id (admin) — NEW: accepts offer_price
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const { title, description, price, offer_price, duration_hrs, lesson_count, thumbnail, video_url, tag, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE courses SET
         title=COALESCE($1,title), description=COALESCE($2,description),
         price=COALESCE($3,price), offer_price=COALESCE($4,offer_price),
         duration_hrs=COALESCE($5,duration_hrs), lesson_count=COALESCE($6,lesson_count),
         thumbnail=COALESCE($7,thumbnail), video_url=COALESCE($8,video_url),
         tag=COALESCE($9,tag), is_active=COALESCE($10,is_active)
       WHERE id=$11 RETURNING *`,
      [title, description, price, offer_price, duration_hrs, lesson_count, thumbnail, video_url, tag, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/courses/:id (admin — soft delete, NEW)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE courses SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Course removed" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
