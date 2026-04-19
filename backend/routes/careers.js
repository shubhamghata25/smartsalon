/**
 * FILE: backend/routes/careers.js  [MODIFIED]
 *
 * Changes from v1:
 *  - Jobs are now loaded from the DB (jobs table) instead of the hardcoded array
 *  - Admin can POST/PATCH/DELETE jobs
 *  - All v1 application endpoints preserved unchanged
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const upload = require("../utils/multer");

// ── JOBS (DB-backed, admin editable) ────────────────────────────────────────

// GET /api/careers/jobs — public, active only
router.get("/jobs", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM jobs WHERE is_active=TRUE ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/careers/jobs (admin)
router.post("/jobs", authenticate, requireAdmin, async (req, res) => {
  const { title, type, experience, salary, description } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  try {
    const { rows } = await db.query(
      "INSERT INTO jobs (title,type,experience,salary,description) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [title, type || "Full-time", experience, salary, description]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/careers/jobs/:id (admin)
router.patch("/jobs/:id", authenticate, requireAdmin, async (req, res) => {
  const { title, type, experience, salary, description, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE jobs SET
         title=COALESCE($1,title), type=COALESCE($2,type),
         experience=COALESCE($3,experience), salary=COALESCE($4,salary),
         description=COALESCE($5,description), is_active=COALESCE($6,is_active)
       WHERE id=$7 RETURNING *`,
      [title, type, experience, salary, description, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/careers/jobs/:id (admin — soft delete)
router.delete("/jobs/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE jobs SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ message: "Job removed" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── APPLICATIONS (unchanged from v1) ────────────────────────────────────────

router.post("/apply", (req, res, next) => {
  req.uploadFolder = "resumes"; next();
}, upload.single("resume"), async (req, res) => {
  const { job_title, name, email, phone, experience, cover_letter } = req.body;
  if (!name || !email || !job_title)
    return res.status(400).json({ error: "name, email, and job_title required" });
  try {
    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;
    const { rows } = await db.query(
      `INSERT INTO applications (job_title,name,email,phone,experience,cover_letter,resume_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [job_title, name, email, phone, experience, cover_letter, resumeUrl]
    );
    res.status(201).json({ message: "Application submitted successfully", id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/applications", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM applications ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch("/applications/:id", authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const valid = ["new","reviewed","shortlisted","rejected"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    const { rows } = await db.query(
      "UPDATE applications SET status=$1 WHERE id=$2 RETURNING *", [status, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
