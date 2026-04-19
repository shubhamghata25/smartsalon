# 🪒 SmartSalon — Full-Stack Production App

> Premium Unisex Salon Platform — Next.js + Express + PostgreSQL

---

## 🗂 Project Structure

```
smartsalon/
├── frontend/          # Next.js 14 App Router
│   ├── app/
│   │   ├── page.jsx           ← Home
│   │   ├── services/page.jsx  ← Services
│   │   ├── booking/page.jsx   ← Appointments
│   │   ├── courses/page.jsx   ← Paid Courses
│   │   ├── careers/page.jsx   ← Jobs + Apply
│   │   ├── contact/page.jsx   ← Contact + Map
│   │   ├── login/page.jsx     ← Auth
│   │   ├── dashboard/page.jsx ← User Portal
│   │   └── admin/page.jsx     ← Admin Panel
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   └── lib/
│       ├── api.js             ← Axios client + all endpoints
│       └── auth.js            ← Auth context
│
└── backend/           # Node.js + Express
    ├── server.js              ← Entry point
    ├── routes/                ← REST API routes
    │   ├── auth.js            ← /api/auth/*
    │   ├── services.js        ← /api/services/*
    │   ├── bookings.js        ← /api/bookings/*
    │   ├── timeslots.js       ← /api/timeslots/*
    │   ├── payments.js        ← /api/payments/*
    │   ├── courses.js         ← /api/courses/*
    │   ├── careers.js         ← /api/careers/*
    │   ├── contacts.js        ← /api/contacts/*
    │   ├── users.js           ← /api/users/*
    │   └── admin.js           ← /api/admin/*
    ├── config/
    │   ├── db.js              ← PostgreSQL pool
    │   ├── migrate.js         ← DB schema setup
    │   └── seed.js            ← Initial data
    ├── middleware/
    │   └── auth.js            ← JWT + admin guard
    └── utils/
        ├── email.js           ← Nodemailer (Gmail SMTP)
        └── multer.js          ← File upload handler
```

---

## ⚡ Quick Start (Local)

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env      # fill in your values
npm install
node config/migrate.js    # create tables
node config/seed.js       # seed data + admin user

# Frontend
cd ../frontend
cp .env.local.example .env.local   # fill in values
npm install
```

### 2. Run Dev Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open: http://localhost:3000
Admin: http://localhost:3000/admin (use ADMIN_EMAIL/ADMIN_PASSWORD from .env)

---

## 🔑 Environment Variables

### Backend `.env`

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Secret key (min 32 chars) | `super_secret_key_here` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `SMTP_HOST` | Email server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Gmail address | `you@gmail.com` |
| `SMTP_PASS` | Gmail App Password | (from Google account) |
| `OWNER_EMAIL` | Salon owner email | `owner@yoursalon.com` |
| `RAZORPAY_KEY_ID` | Razorpay key | `rzp_live_xxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `xxx` |
| `ADMIN_EMAIL` | Admin login email | `admin@yoursalon.com` |
| `ADMIN_PASSWORD` | Admin password | `SecurePass@123` |
| `FRONTEND_URL` | Frontend origin (CORS) | `https://yoursalon.vercel.app` |

### Frontend `.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL, e.g. `https://api.onrender.com/api` |
| `NEXT_PUBLIC_RAZORPAY_KEY` | Razorpay public key |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number with country code |
| `NEXT_PUBLIC_UPI_ID` | UPI ID for manual payments |

---

## 🚀 Deployment (Free Tier)

### Step 1 — Deploy Backend on Render

1. Create account at [render.com](https://render.com)
2. **New → PostgreSQL** (Free tier) — copy connection string
3. **New → Web Service** → connect GitHub repo
   - Root: `backend/`
   - Build: `npm install`
   - Start: `npm start`
4. Add all env vars from `.env.example`
5. After deploy, run migrations:
   ```bash
   # In Render Shell
   node config/migrate.js && node config/seed.js
   ```
6. Copy your Render URL: `https://smartsalon-api.onrender.com`

### Step 2 — Deploy Frontend on Vercel

1. Create account at [vercel.com](https://vercel.com)
2. Import GitHub repo
   - Root: `frontend/`
   - Framework: Next.js
3. Add env vars:
   - `NEXT_PUBLIC_API_URL` = `https://smartsalon-api.onrender.com/api`
   - others as needed
4. Deploy → get URL like `https://smartsalon.vercel.app`
5. Update backend `FRONTEND_URL` env var on Render

### Step 3 — Gmail SMTP Setup (Free Email)

1. Go to Google Account → Security → 2-Step Verification (enable)
2. Google Account → Security → App Passwords
3. Generate app password for "Mail"
4. Use that 16-char password as `SMTP_PASS`

### Step 4 — Razorpay Setup (India)

1. Sign up at [razorpay.com](https://razorpay.com) (free)
2. Get Test keys from Dashboard → API Keys
3. Test transactions cost nothing; live ~2% per transaction
4. Add keys to env

---

## 🏦 Payment Flows

### Flow 1: Razorpay (Recommended for live)
```
User → Book → Create Order (backend) → Razorpay SDK → Payment → Verify Signature → Confirm
```

### Flow 2: Manual UPI (Zero Cost)
```
User → Book → Upload Screenshot → Admin Reviews → Approve → Booking Confirmed
```

### Flow 3: Cash at Salon
```
User → Book → Pay at counter
```

---

## 📡 API Reference

```
POST  /api/auth/register          Register user
POST  /api/auth/login             Login → JWT
GET   /api/auth/me                Current user

GET   /api/services               List all services
POST  /api/services               Create service (admin)
PATCH /api/services/:id           Update service (admin)
DELETE /api/services/:id          Delete service (admin)

GET   /api/bookings/availability  Get available slots for date
POST  /api/bookings               Create booking (sends email)
GET   /api/bookings               List bookings (admin: all, user: own)
PATCH /api/bookings/:id/status    Update status (admin)
PATCH /api/bookings/:id/cancel    Cancel booking (user/admin)

POST  /api/payments/razorpay/order    Create Razorpay order
POST  /api/payments/razorpay/verify   Verify Razorpay payment
POST  /api/payments/upi/upload        Upload UPI screenshot
GET   /api/payments/pending           Pending UPI payments (admin)
PATCH /api/payments/:id/verify        Approve/reject UPI (admin)

GET   /api/courses                List courses
GET   /api/courses/:id/access     Access course content (enrolled users)
POST  /api/courses/:id/enroll     Enroll in course

POST  /api/careers/apply          Submit job application
GET   /api/careers/applications   List applications (admin)

POST  /api/contacts               Send contact message
GET   /api/contacts               List messages (admin)

GET   /api/admin/dashboard        Stats + analytics (admin)
GET   /api/admin/users            All users (admin)

GET   /api/users/my-bookings      User's bookings
GET   /api/users/my-courses       User's enrolled courses
PATCH /api/users/profile          Update profile
```

---

## 💰 Cost Estimate (Monthly)

| Service | Free Tier | Paid |
|---|---|---|
| Vercel (Frontend) | 100GB/mo bandwidth | $20/mo |
| Render (Backend) | 750 hrs/mo (sleeps after 15m) | $7/mo |
| Render PostgreSQL | 1GB storage | $7/mo |
| Gmail SMTP | 500 emails/day | Free |
| Razorpay | Free signup, ~2% per txn | Transaction-based |

**Total operational cost: ~₹0–₹100/mo at small scale**

---

## 🔐 Security Features

- JWT authentication with expiry
- bcrypt password hashing (12 rounds)
- Express rate limiting (100 req/15min)
- Helmet.js security headers
- CORS configured for frontend origin only
- Input validation with express-validator
- File upload type + size restrictions
- Admin role guard on all protected routes
- Razorpay signature verification

---

## 📧 Email Notifications

Three automatic emails are sent:
1. **Booking Confirmation** → customer (with booking details)
2. **Booking Alert** → salon owner (immediate notification)
3. **Reminder** → customer (24hrs before appointment — set up a cron job)

### Setting up Reminder Cron (Render)

Add a separate cron job service on Render or use `node-cron` in server.js:
```js
const cron = require("node-cron");
// Run at 9 AM daily
cron.schedule("0 9 * * *", async () => {
  // Query bookings for tomorrow, send reminder emails
});
```

---

*Built with ❤️ for SmartSalon*
