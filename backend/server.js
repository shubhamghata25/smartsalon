/**
 * FILE: backend/server.js  [MODIFIED v2.1]
 *
 * Changes:
 *  1. Auto-runs migrations on every startup — no shell access needed
 *  2. Self-ping every 14 min — keeps Render free tier awake
 *  3. Database is now Neon (same pg driver, different connection string)
 */
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const rateLimit = require("express-rate-limit");
const path    = require("path");
const http    = require("http");
const https   = require("https");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/services",     require("./routes/services"));
app.use("/api/sub-services", require("./routes/subservices"));
app.use("/api/bookings",     require("./routes/bookings"));
app.use("/api/timeslots",    require("./routes/timeslots"));
app.use("/api/payments",     require("./routes/payments"));
app.use("/api/courses",      require("./routes/courses"));
app.use("/api/careers",      require("./routes/careers"));
app.use("/api/contacts",     require("./routes/contacts"));
app.use("/api/admin",        require("./routes/admin"));
app.use("/api/users",        require("./routes/users"));
app.use("/api/offers",       require("./routes/offers"));
app.use("/api/settings",     require("./routes/settings"));

app.get("/api/health", (req, res) => res.json({ status: "ok", ts: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ── AUTO-MIGRATE ON STARTUP ──────────────────────────────────────────────────
// Runs migrate.js + migrate_v2.js automatically — no shell needed.
// Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so it is safe to run every time.
async function runMigrations() {
  try {
    await require("./config/migrate").run();
    await require("./config/migrate_v2").run();
    // Seed only inserts ON CONFLICT DO NOTHING — safe to run every time
    await require("./config/seed").run();
    console.log("✅ Migrations + seed applied");
  } catch (err) {
    console.error("⚠️  Migration warning (safe to ignore if tables exist):", err.message);
  }
}

// ── SELF-PING: keeps Render free tier awake every 14 min ────────────────────
// Render free services sleep after 15 min of inactivity.
// This pings /api/health every 14 min so the server never sleeps.
// Only runs in production to avoid noise in local dev.
function startKeepAlive() {
  if (process.env.NODE_ENV !== "production") return;
  const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
  if (!selfUrl) {
    console.log("ℹ️  RENDER_EXTERNAL_URL not set — keep-alive disabled");
    return;
  }
  const pingUrl = `${selfUrl}/api/health`;
  const client  = pingUrl.startsWith("https") ? https : http;

  setInterval(() => {
    client.get(pingUrl, (res) => {
      console.log(`🏓 Keep-alive ping → ${res.statusCode}`);
    }).on("error", (e) => {
      console.error("Keep-alive ping failed:", e.message);
    });
  }, 14 * 60 * 1000); // every 14 minutes

  console.log(`🏓 Keep-alive started — pinging ${pingUrl} every 14 min`);
}

// ── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 SmartSalon API running on port ${PORT}`);
    startKeepAlive();
  });
});
