"use client";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 15000,
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

export const authAPI = {
  register: (d) => api.post("/auth/register", d),
  login:    (d) => api.post("/auth/login", d),
  me:       ()  => api.get("/auth/me"),
};

export const categoriesAPI = {
  list:          ()           => api.get("/categories"),
  withServices:  (id)         => api.get(`/categories/${id}/services`),
  create:        (d)          => api.post("/categories", d),
  update:        (id, d)      => api.patch(`/categories/${id}`, d),
  delete:        (id)         => api.delete(`/categories/${id}`),
};

export const servicesAPI = {
  list:    (params) => api.get("/services", { params }),
  get:     (id)     => api.get(`/services/${id}`),
  create:  (d)      => api.post("/services", d),
  update:  (id, d)  => api.patch(`/services/${id}`, d),
  delete:  (id)     => api.delete(`/services/${id}`),
};

export const subServicesAPI = {
  byService: (sid)    => api.get(`/sub-services?service_id=${sid}`),
  all:       ()        => api.get("/sub-services/all"),
  create:    (d)       => api.post("/sub-services", d),
  update:    (id, d)   => api.patch(`/sub-services/${id}`, d),
  delete:    (id)      => api.delete(`/sub-services/${id}`),
};

export const bookingsAPI = {
  availability:   (date, sid) => api.get(`/bookings/availability?date=${date}&service_id=${sid}`),
  create:         (d)         => api.post("/bookings", d),
  list:           ()          => api.get("/bookings"),
  get:            (id)        => api.get(`/bookings/${id}`),
  updateStatus:   (id, s)     => api.patch(`/bookings/${id}/status`, { status: s }),
  cancel:         (id)        => api.patch(`/bookings/${id}/cancel`),
  confirmPayment: (id, pid)   => api.patch(`/bookings/${id}/confirm-payment`, { payment_id: pid }),
};

export const paymentsAPI = {
  createRazorpayOrder: (bid)   => api.post("/payments/razorpay/order", { booking_id: bid }),
  verifyRazorpay:      (d)      => api.post("/payments/razorpay/verify", d),
  createPaytmOrder:    (bid)   => api.post("/payments/paytm/order", { booking_id: bid }),
  uploadUpiScreenshot: (fd)    => api.post("/payments/upi/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  pendingUpi:          ()       => api.get("/payments/pending"),
  verifyManual:        (id, d)  => api.patch(`/payments/${id}/verify`, d),
  list:                ()       => api.get("/payments"),
};

export const coursesAPI = {
  list:   ()          => api.get("/courses"),
  get:    (id)        => api.get(`/courses/${id}`),
  access: (id)        => api.get(`/courses/${id}/access`),
  enroll: (id, pid)   => api.post(`/courses/${id}/enroll`, { payment_id: pid }),
  create: (d)         => api.post("/courses", d),
  update: (id, d)     => api.patch(`/courses/${id}`, d),
  delete: (id)        => api.delete(`/courses/${id}`),
};

export const careersAPI = {
  jobs:              ()          => api.get("/careers/jobs"),
  createJob:         (d)         => api.post("/careers/jobs", d),
  updateJob:         (id, d)     => api.patch(`/careers/jobs/${id}`, d),
  deleteJob:         (id)        => api.delete(`/careers/jobs/${id}`),
  apply:             (fd)        => api.post("/careers/apply", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  applications:      ()          => api.get("/careers/applications"),
  updateApplication: (id, s)     => api.patch(`/careers/applications/${id}`, { status: s }),
};

export const offersAPI = {
  list:   ()           => api.get("/offers"),
  all:    ()           => api.get("/offers/all"),
  create: (fd)         => api.post("/offers", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, fd)     => api.patch(`/offers/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id)         => api.delete(`/offers/${id}`),
};

export const videosAPI = {
  list:   ()           => api.get("/videos"),
  create: (d)          => api.post("/videos", d),
  update: (id, d)      => api.patch(`/videos/${id}`, d),
  delete: (id)         => api.delete(`/videos/${id}`),
};

export const settingsAPI = {
  get:        ()   => api.get("/settings"),
  update:     (d)  => api.patch("/settings", d),
  uploadLogo: (fd) => api.post("/settings/logo", fd, { headers: { "Content-Type": "multipart/form-data" } }),
};

export const uploadAPI = {
  image: (fd, folder = "lonaz-luxe/general") =>
    api.post(`/upload/image?folder=${folder}`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
  video: (fd, folder = "lonaz-luxe/videos") =>
    api.post(`/upload/video?folder=${folder}`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
};

export const contactsAPI = {
  send:     (d)  => api.post("/contacts", d),
  list:     ()   => api.get("/contacts"),
  markRead: (id) => api.patch(`/contacts/${id}/read`),
};

export const adminAPI = {
  dashboard:     () => api.get("/admin/dashboard"),
  users:         () => api.get("/admin/users"),
  todayBookings: () => api.get("/admin/bookings/today"),
};

export const usersAPI = {
  myBookings:    () => api.get("/users/my-bookings"),
  myCourses:     () => api.get("/users/my-courses"),
  updateProfile: (d) => api.patch("/users/profile", d),
};
