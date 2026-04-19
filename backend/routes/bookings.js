/**
 * FILE: backend/routes/bookings.js  [MODIFIED]
 *
 * Changes from v1:
 *  - Booking creation now computes total_amount / paid_amount (20%) / remaining_amount
 *  - Booking status defaults to 'pending'; confirmed only after payment success
 *  - calculateFinalAmount() from paymentUtils wired in
 *  - All existing endpoints preserved unchanged
 */
const router = require("express").Router();
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const { sendBookingConfirmation, sendOwnerAlert } = require("../utils/email");
const { calculateFinalAmount } = require("../utils/paymentUtils");

const genRef = () => "SB" + Date.now().toString(36).toUpperCase().slice(-6);

// ── AVAILABILITY (unchanged) ────────────────────────────────────────────────
router.get("/availability", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "date required" });
  try {
    const slots = await db.query("SELECT slot_time FROM time_slot_configs WHERE is_active=TRUE ORDER BY slot_time");
    const booked = await db.query(
      "SELECT booking_time FROM bookings WHERE booking_date=$1 AND status NOT IN ('cancelled')",
      [date]
    );
    const bookedTimes = booked.rows.map(r => r.booking_time.slice(0, 5));
    const result = slots.rows.map(r => ({
      time: r.slot_time.slice(0, 5),
      available: !bookedTimes.includes(r.slot_time.slice(0, 5)),
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CREATE BOOKING — now includes advance payment calculation ───────────────
router.post("/", [
  body("service_id").notEmpty(),
  body("customer_name").trim().isLength({ min: 2 }),
  body("customer_email").isEmail().normalizeEmail(),
  body("booking_date").isDate(),
  body("booking_time").matches(/^\d{2}:\d{2}$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    service_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, notes, user_id,
    payment_method = "razorpay",   // NEW: client sends preferred gateway
    sub_service_id,                // NEW: optional sub-service
  } = req.body;

  try {
    // Prevent double booking
    const conflict = await db.query(
      "SELECT id FROM bookings WHERE booking_date=$1 AND booking_time=$2 AND status NOT IN ('cancelled')",
      [booking_date, booking_time]
    );
    if (conflict.rows.length) return res.status(409).json({ error: "Slot already booked" });

    // Determine price: sub-service price overrides service price if provided
    let basePrice;
    let resolvedServiceId = service_id;
    if (sub_service_id) {
      const { rows: sub } = await db.query(
        "SELECT * FROM sub_services WHERE id=$1 AND is_active=TRUE", [sub_service_id]
      );
      if (!sub.length) return res.status(404).json({ error: "Sub-service not found" });
      basePrice = parseFloat(sub[0].price);
      resolvedServiceId = sub[0].service_id;
    } else {
      const { rows: svc } = await db.query("SELECT * FROM services WHERE id=$1", [service_id]);
      if (!svc.rows && !svc.length) return res.status(404).json({ error: "Service not found" });
      const svcRow = svc[0] || svc.rows?.[0];
      if (!svcRow) return res.status(404).json({ error: "Service not found" });
      basePrice = parseFloat(svcRow.price);
    }

    // ── ADVANCE PAYMENT CALCULATION (NEW) ──────────────────────────────────
    const payCalc = calculateFinalAmount(basePrice, payment_method, "advance");

    const ref = genRef();
    const { rows } = await db.query(
      `INSERT INTO bookings
         (booking_ref, user_id, service_id, sub_service_id,
          customer_name, customer_email, customer_phone,
          booking_date, booking_time, notes, status,
          amount,
          total_amount, paid_amount, remaining_amount, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',
               $11,
               $12,$13,$14,'unpaid')
       RETURNING *`,
      [
        ref, user_id || null, resolvedServiceId, sub_service_id || null,
        customer_name, customer_email, customer_phone,
        booking_date, booking_time, notes,
        basePrice,                         // legacy amount field
        payCalc.totalAmount,               // total_amount
        payCalc.advanceAmount,             // paid_amount (to be confirmed after payment)
        payCalc.remainingAmount,           // remaining_amount (pay at salon)
      ]
    );

    const booking = rows[0];

    // Return payment calculation so frontend can create gateway order immediately
    res.status(201).json({
      ...booking,
      paymentRequired: payCalc,
    });

  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CONFIRM BOOKING AFTER PAYMENT (NEW endpoint) ────────────────────────────
// Called by payments route after gateway verification
router.patch("/:id/confirm-payment", authenticate, async (req, res) => {
  const { payment_id } = req.body;
  try {
    // Verify payment exists and is successful
    const { rows: pay } = await db.query(
      "SELECT * FROM payments WHERE id=$1 AND status='success'", [payment_id]
    );
    if (!pay.length) return res.status(402).json({ error: "Payment not verified" });

    const { rows: booking } = await db.query(
      `UPDATE bookings
         SET status='confirmed', payment_status='partially_paid',
             paid_amount=$1
       WHERE id=$2 RETURNING *`,
      [pay[0].amount, req.params.id]
    );
    if (!booking.length) return res.status(404).json({ error: "Booking not found" });

    // Fetch service name for email
    const { rows: svc } = await db.query("SELECT name FROM services WHERE id=$1", [booking[0].service_id]);
    const svcName = svc[0]?.name || "Service";

    // Send confirmation emails (non-blocking)
    sendBookingConfirmation({
      to: booking[0].customer_email, name: booking[0].customer_name,
      service: svcName, date: booking[0].booking_date,
      time: booking[0].booking_time, bookingRef: booking[0].booking_ref,
      amount: booking[0].total_amount,
      advancePaid: booking[0].paid_amount,
      remainingAtSalon: booking[0].remaining_amount,
    }).catch(console.error);
    sendOwnerAlert({
      name: booking[0].customer_name, service: svcName,
      date: booking[0].booking_date, time: booking[0].booking_time,
      phone: booking[0].customer_phone, bookingRef: booking[0].booking_ref,
    }).catch(console.error);

    res.json(booking[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LIST BOOKINGS (unchanged) ───────────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    let q, params;
    if (req.user.role === "admin") {
      q = `SELECT b.*,s.name AS service_name,ss.name AS sub_service_name
           FROM bookings b
           LEFT JOIN services s ON b.service_id=s.id
           LEFT JOIN sub_services ss ON b.sub_service_id=ss.id
           ORDER BY b.booking_date DESC, b.booking_time`;
      params = [];
    } else {
      q = `SELECT b.*,s.name AS service_name,ss.name AS sub_service_name
           FROM bookings b
           LEFT JOIN services s ON b.service_id=s.id
           LEFT JOIN sub_services ss ON b.sub_service_id=ss.id
           WHERE b.user_id=$1 ORDER BY b.booking_date DESC`;
      params = [req.user.id];
    }
    const { rows } = await db.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET SINGLE BOOKING (unchanged) ─────────────────────────────────────────
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*,s.name AS service_name,s.duration
       FROM bookings b LEFT JOIN services s ON b.service_id=s.id WHERE b.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "admin" && rows[0].user_id !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── UPDATE STATUS (admin) — unchanged ──────────────────────────────────────
router.patch("/:id/status", authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!["pending","confirmed","completed","cancelled"].includes(status))
    return res.status(400).json({ error: "Invalid status" });
  try {
    const { rows } = await db.query(
      "UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *", [status, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CANCEL (user) — unchanged ───────────────────────────────────────────────
router.patch("/:id/cancel", authenticate, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM bookings WHERE id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "admin" && rows[0].user_id !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });
    await db.query("UPDATE bookings SET status='cancelled' WHERE id=$1", [req.params.id]);
    res.json({ message: "Booking cancelled" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
