/**
 * FILE: backend/server.js  [UPDATED — Lonaz Luxe v3]
 * - Auto-runs all 3 migrations on startup
 * - Self-ping keep-alive (14 min)
 * - New routes: categories, videos, upload
 */
require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const path      = require("path");
const http      = require("http");
const https     = require("https");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/auth"));
app.use("/api/categories",    require("./routes/categories"));   // NEW
app.use("/api/services",      require("./routes/services"));
app.use("/api/sub-services",  require("./routes/subservices"));
app.use("/api/bookings",      require("./routes/bookings"));
app.use("/api/timeslots",     require("./routes/timeslots"));
app.use("/api/payments",      require("./routes/payments"));
app.use("/api/courses",       require("./routes/courses"));
app.use("/api/careers",       require("./routes/careers"));
app.use("/api/contacts",      require("./routes/contacts"));
app.use("/api/admin",         require("./routes/admin"));
app.use("/api/users",         require("./routes/users"));
app.use("/api/offers",        require("./routes/offers"));
app.use("/api/settings",      require("./routes/settings"));
app.use("/api/videos",        require("./routes/videos"));       // NEW
app.use("/api/upload",        require("./routes/upload"));       // NEW

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", salon: "Lonaz Luxe Salon", ts: new Date() })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ── AUTO-MIGRATE ──────────────────────────────────────────────────────────────
async function runMigrations() {
  try {
    await require("./config/migrate").run();
    await require("./config/migrate_v2").run();
    await require("./config/migrate_v3").run();
    await require("./config/seed").run();
    console.log("✅ All migrations + seed applied");
  } catch (err) {
    console.error("⚠️  Migration warning:", err.message);
  }
}

// ── SELF-PING KEEP-ALIVE ──────────────────────────────────────────────────────
function startKeepAlive() {
  if (process.env.NODE_ENV !== "production") return;
  const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
  if (!selfUrl) return;
  const pingUrl = `${selfUrl}/api/health`;
  const client  = pingUrl.startsWith("https") ? https : http;
  setInterval(() => {
    client.get(pingUrl, (res) => {
      console.log(`🏓 Keep-alive ping → ${res.statusCode}`);
    }).on("error", (e) => console.error("Keep-alive error:", e.message));
  }, 14 * 60 * 1000);
  console.log(`🏓 Keep-alive started → ${pingUrl}`);
}

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Lonaz Luxe API on port ${PORT}`);
    startKeepAlive();
  });
});
