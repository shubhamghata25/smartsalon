const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

const sign = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

// POST /api/auth/register
router.post("/register", [
  body("name").trim().isLength({ min: 2 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, phone } = req.body;
  try {
    const exists = await db.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      "INSERT INTO users (name,email,password,phone) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role",
      [name, email, hash, phone]
    );
    res.status(201).json({ token: sign(rows[0]), user: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const { password: _, ...user } = rows[0];
    res.json({ token: sign(user), user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id,name,email,phone,role,avatar_url,created_at FROM users WHERE id=$1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
