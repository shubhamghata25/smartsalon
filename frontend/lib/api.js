/**
 * FILE: frontend/lib/api.js  [MODIFIED]
 * Added: offersAPI, subServicesAPI, settingsAPI
 * Modified: paymentsAPI (Paytm order), bookingsAPI (payment_method param)
 */
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ss_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("ss_token");
      localStorage.removeItem("ss_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── AUTH (unchanged) ────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
  me:       ()     => api.get("/auth/me"),
};

// ── SERVICES (unchanged) ────────────────────────────────────────────────────
export const servicesAPI = {
  list:   ()           => api.get("/services"),
  get:    (id)         => api.get(`/services/${id}`),
  create: (data)       => api.post("/services", data),
  update: (id, data)   => api.patch(`/services/${id}`, data),
  delete: (id)         => api.delete(`/services/${id}`),
};

// ── SUB-SERVICES (NEW) ──────────────────────────────────────────────────────
export const subServicesAPI = {
  byService: (serviceId)   => api.get(`/sub-services?service_id=${serviceId}`),
  all:       ()             => api.get("/sub-services/all"),
  create:    (data)         => api.post("/sub-services", data),
  update:    (id, data)     => api.patch(`/sub-services/${id}`, data),
  delete:    (id)           => api.delete(`/sub-services/${id}`),
};

// ── BOOKINGS (MODIFIED: payment_method field) ────────────────────────────────
export const bookingsAPI = {
  availability: (date, serviceId) =>
    api.get(`/bookings/availability?date=${date}&service_id=${serviceId}`),
  create:       (data)    => api.post("/bookings", data),          // data includes payment_method
  list:         ()        => api.get("/bookings"),
  get:          (id)      => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  cancel:       (id)      => api.patch(`/bookings/${id}/cancel`),
  confirmPayment: (id, paymentId) =>
    api.patch(`/bookings/${id}/confirm-payment`, { payment_id: paymentId }),
};

// ── PAYMENTS (MODIFIED: Paytm order added) ───────────────────────────────────
export const paymentsAPI = {
  createRazorpayOrder: (bookingId) =>
    api.post("/payments/razorpay/order", { booking_id: bookingId }),
  verifyRazorpay:      (data)       => api.post("/payments/razorpay/verify", data),
  createPaytmOrder:    (bookingId)  =>
    api.post("/payments/paytm/order", { booking_id: bookingId }),  // NEW
  uploadUpiScreenshot: (formData)   =>
    api.post("/payments/upi/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  pendingUpi:          ()           => api.get("/payments/pending"),
  verifyManual:        (id, data)   => api.patch(`/payments/${id}/verify`, data),
  list:                ()           => api.get("/payments"),
};

// ── COURSES (MODIFIED: delete endpoint) ──────────────────────────────────────
export const coursesAPI = {
  list:    ()           => api.get("/courses"),
  get:     (id)         => api.get(`/courses/${id}`),
  access:  (id)         => api.get(`/courses/${id}/access`),
  enroll:  (id, payId)  => api.post(`/courses/${id}/enroll`, { payment_id: payId }),
  create:  (data)       => api.post("/courses", data),
  update:  (id, data)   => api.patch(`/courses/${id}`, data),
  delete:  (id)         => api.delete(`/courses/${id}`),            // NEW
};

// ── CAREERS (MODIFIED: job CRUD) ─────────────────────────────────────────────
export const careersAPI = {
  jobs:              ()           => api.get("/careers/jobs"),
  createJob:         (data)       => api.post("/careers/jobs", data),         // NEW
  updateJob:         (id, data)   => api.patch(`/careers/jobs/${id}`, data),  // NEW
  deleteJob:         (id)         => api.delete(`/careers/jobs/${id}`),       // NEW
  apply:             (formData)   =>
    api.post("/careers/apply", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  applications:      ()           => api.get("/careers/applications"),
  updateApplication: (id, status) => api.patch(`/careers/applications/${id}`, { status }),
};

// ── OFFERS (NEW) ─────────────────────────────────────────────────────────────
export const offersAPI = {
  list:   ()           => api.get("/offers"),
  all:    ()           => api.get("/offers/all"),
  create: (formData)   =>
    api.post("/offers", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) =>
    api.patch(`/offers/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id)         => api.delete(`/offers/${id}`),
};

// ── SETTINGS (NEW) ───────────────────────────────────────────────────────────
export const settingsAPI = {
  get:        ()       => api.get("/settings"),
  update:     (data)   => api.patch("/settings", data),
  uploadLogo: (fd)     =>
    api.post("/settings/logo", fd, { headers: { "Content-Type": "multipart/form-data" } }),
};

// ── CONTACTS (unchanged) ─────────────────────────────────────────────────────
export const contactsAPI = {
  send:     (data) => api.post("/contacts", data),
  list:     ()     => api.get("/contacts"),
  markRead: (id)   => api.patch(`/contacts/${id}/read`),
};

// ── ADMIN (unchanged) ────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:     () => api.get("/admin/dashboard"),
  users:         () => api.get("/admin/users"),
  todayBookings: () => api.get("/admin/bookings/today"),
};

// ── USERS (unchanged) ────────────────────────────────────────────────────────
export const usersAPI = {
  myBookings:    () => api.get("/users/my-bookings"),
  myCourses:     () => api.get("/users/my-courses"),
  updateProfile: (data) => api.patch("/users/profile", data),
};
