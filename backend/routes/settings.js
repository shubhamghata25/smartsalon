/**
 * FILE: backend/routes/settings.js  [NEW]
 * Admin settings: salon_name, logo_url, upi_id, whatsapp_number
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const upload = require("../utils/multer");

// GET /api/settings — public (navbar needs salon_name + logo)
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT key, value FROM admin_settings");
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/settings (admin) — update one or many keys
router.patch("/", authenticate, requireAdmin, async (req, res) => {
  const allowed = ["salon_name", "upi_id", "whatsapp_number"];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: "No valid settings provided" });
  try {
    for (const [key, value] of updates) {
      await db.query(
        `INSERT INTO admin_settings (key,value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
        [key, value]
      );
    }
    const { rows } = await db.query("SELECT key, value FROM admin_settings");
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/settings/logo (admin) — upload logo image
router.post("/logo", authenticate, requireAdmin, (req, res, next) => {
  req.uploadFolder = "settings"; next();
}, upload.single("logo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Logo file required" });
  try {
    const logoUrl = `/uploads/settings/${req.file.filename}`;
    await db.query(
      `INSERT INTO admin_settings (key,value) VALUES ('logo_url',$1)
       ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
      [logoUrl]
    );
    res.json({ logo_url: logoUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
