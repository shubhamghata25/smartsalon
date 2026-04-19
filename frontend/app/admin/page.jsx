/**
 * FILE: frontend/app/admin/page.jsx  [MODIFIED]
 *
 * Changes from v1 (ONLY new/changed tabs — all existing tabs preserved):
 *  - Offers tab (NEW): Add/Edit/Delete offers
 *  - Sub-services tab (NEW): Manage sub-services per parent service
 *  - Courses tab (MODIFIED): Delete + offer_price field
 *  - Careers tab (MODIFIED): Job CRUD from DB
 *  - Settings tab (NEW): Salon name + logo upload
 *  - Payments tab (MODIFIED): shows fee_applied, payment_method
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  adminAPI, bookingsAPI, servicesAPI, subServicesAPI, paymentsAPI,
  contactsAPI, careersAPI, coursesAPI, offersAPI, settingsAPI, adminAPI as aAPI,
} from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  LayoutDashboard, CalendarDays, Scissors, CreditCard, MessageSquare,
  Users, Briefcase, LogOut, TrendingUp, Loader, CheckCircle, XCircle,
  Edit, Trash2, Plus, BarChart3, Gift, Settings, BookOpen, Tag,
} from "lucide-react";

const TABS = [
  { id: "overview",     label: "Overview",     icon: LayoutDashboard },
  { id: "bookings",     label: "Bookings",     icon: CalendarDays },
  { id: "services",     label: "Services",     icon: Scissors },
  { id: "sub_services", label: "Sub-Services", icon: Tag },       // NEW
  { id: "payments",     label: "Payments",     icon: CreditCard },
  { id: "courses",      label: "Courses",      icon: BookOpen },
  { id: "offers",       label: "Offers",       icon: Gift },       // NEW
  { id: "contacts",     label: "Messages",     icon: MessageSquare },
  { id: "applications", label: "Careers",      icon: Briefcase },
  { id: "users",        label: "Users",        icon: Users },
  { id: "settings",     label: "Settings",     icon: Settings },  // NEW
];

const STATUS_COLORS = {
  confirmed: "#2E7D32", pending: "#9B8B7A", completed: "#C9A84C",
  cancelled: "#C62828", success: "#2E7D32", failed: "#C62828",
  new: "#C9A84C", reviewed: "#9B8B7A", shortlisted: "#2E7D32", rejected: "#C62828",
};

const EMPTY_SERVICE_FORM = { name: "", description: "", price: "", duration: "", icon: "✂️", category: "Hair" };
const EMPTY_SUB_FORM     = { service_id: "", name: "", price: "", duration: "" };
const EMPTY_COURSE_FORM  = { title: "", description: "", price: "", offer_price: "", duration_hrs: "", lesson_count: "", tag: "", video_url: "" };
const EMPTY_OFFER_FORM   = { title: "", description: "", discount: "", image_url: "" };
const EMPTY_JOB_FORM     = { title: "", type: "Full-time", experience: "", salary: "", description: "" };

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Data
  const [stats, setStats]           = useState(null);
  const [bookings, setBookings]     = useState([]);
  const [services, setServices]     = useState([]);
  const [subSvcs, setSubSvcs]       = useState([]);
  const [payments, setPayments]     = useState([]);
  const [pendingUpi, setPendingUpi] = useState([]);
  const [contacts, setContacts]     = useState([]);
  const [applications, setApps]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [courses, setCourses]       = useState([]);
  const [offers, setOffers]         = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [siteSettings, setSiteSettings] = useState({});

  // Form states
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);
  const [editingSvcId, setEditingSvcId] = useState(null);
  const [showSvcForm, setShowSvcForm]   = useState(false);

  const [subForm, setSubForm]       = useState(EMPTY_SUB_FORM);
  const [editingSubId, setEditingSubId] = useState(null);
  const [showSubForm, setShowSubForm]   = useState(false);

  const [courseForm, setCourseForm] = useState(EMPTY_COURSE_FORM);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [showCourseForm, setShowCourseForm]   = useState(false);

  const [offerForm, setOfferForm]   = useState(EMPTY_OFFER_FORM);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [showOfferForm, setShowOfferForm]   = useState(false);

  const [jobForm, setJobForm]       = useState(EMPTY_JOB_FORM);
  const [editingJobId, setEditingJobId] = useState(null);
  const [showJobForm, setShowJobForm]   = useState(false);

  const [settingsForm, setSettingsForm] = useState({ salon_name: "", upi_id: "", whatsapp_number: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("ss_user");
    if (!u) { router.push("/login"); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== "admin") { toast.error("Admin access required"); router.push("/"); return; }
    setUser(parsed);
  }, [router]);

  const loadTabData = useCallback(async (t) => {
    setLoading(true);
    try {
      switch (t) {
        case "overview":
          const { data: d } = await adminAPI.dashboard();
          setStats(d);
          break;
        case "bookings":
          const { data: b } = await bookingsAPI.list();
          setBookings(b);
          break;
        case "services":
          const { data: sv } = await servicesAPI.list();
          setServices(sv);
          break;
        case "sub_services":
          const [{ data: allSub }, { data: allSv }] = await Promise.all([subServicesAPI.all(), servicesAPI.list()]);
          setSubSvcs(allSub);
          setServices(allSv);
          break;
        case "payments":
          const [allP, pendP] = await Promise.all([paymentsAPI.list(), paymentsAPI.pendingUpi()]);
          setPayments(allP.data); setPendingUpi(pendP.data);
          break;
        case "courses":
          const { data: cs } = await coursesAPI.list();
          setCourses(cs);
          break;
        case "offers":
          const { data: of } = await offersAPI.all();
          setOffers(of);
          break;
        case "contacts":
          const { data: ct } = await contactsAPI.list();
          setContacts(ct);
          break;
        case "applications":
          const [{ data: ap }, { data: jb }] = await Promise.all([careersAPI.applications(), careersAPI.jobs()]);
          setApps(ap); setJobs(jb);
          break;
        case "users":
          const { data: us } = await adminAPI.users();
          setUsers(us);
          break;
        case "settings":
          const { data: st } = await settingsAPI.get();
          setSiteSettings(st);
          setSettingsForm({ salon_name: st.salon_name || "", upi_id: st.upi_id || "", whatsapp_number: st.whatsapp_number || "" });
          break;
      }
    } catch (e) { toast.error("Failed to load: " + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) loadTabData(tab); }, [tab, user, loadTabData]);

  // ── HELPERS ──────────────────────────────────────────────────────────────

  const updateBookingStatus = async (id, status) => {
    try { await bookingsAPI.updateStatus(id, status); setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b)); toast.success("Updated"); }
    catch { toast.error("Failed"); }
  };

  const handleUpiVerify = async (id, approved) => {
    try { await paymentsAPI.verifyManual(id, { approved }); toast.success(approved ? "Approved" : "Rejected"); setPendingUpi(prev => prev.filter(p => p.id !== id)); }
    catch { toast.error("Failed"); }
  };

  const markContactRead = async (id) => {
    try { await contactsAPI.markRead(id); setContacts(prev => prev.map(c => c.id === id ? { ...c, is_read: true } : c)); }
    catch {}
  };

  // Service CRUD
  const handleServiceSubmit = async () => {
    if (!serviceForm.name || !serviceForm.price || !serviceForm.duration) return toast.error("Fill required fields");
    try {
      if (editingSvcId) { await servicesAPI.update(editingSvcId, serviceForm); toast.success("Service updated"); }
      else { await servicesAPI.create(serviceForm); toast.success("Service created"); }
      setShowSvcForm(false); setEditingSvcId(null); setServiceForm(EMPTY_SERVICE_FORM);
      loadTabData("services");
    } catch { toast.error("Failed"); }
  };

  // Sub-service CRUD
  const handleSubSubmit = async () => {
    if (!subForm.service_id || !subForm.name || !subForm.price) return toast.error("service, name, price required");
    try {
      if (editingSubId) { await subServicesAPI.update(editingSubId, subForm); toast.success("Updated"); }
      else { await subServicesAPI.create(subForm); toast.success("Created"); }
      setShowSubForm(false); setEditingSubId(null); setSubForm(EMPTY_SUB_FORM);
      loadTabData("sub_services");
    } catch { toast.error("Failed"); }
  };

  // Course CRUD
  const handleCourseSubmit = async () => {
    if (!courseForm.title || !courseForm.price) return toast.error("title and price required");
    try {
      if (editingCourseId) { await coursesAPI.update(editingCourseId, courseForm); toast.success("Course updated"); }
      else { await coursesAPI.create(courseForm); toast.success("Course created"); }
      setShowCourseForm(false); setEditingCourseId(null); setCourseForm(EMPTY_COURSE_FORM);
      loadTabData("courses");
    } catch { toast.error("Failed"); }
  };
  const deleteCourse = async (id) => {
    if (!confirm("Remove this course?")) return;
    try { await coursesAPI.delete(id); setCourses(prev => prev.filter(c => c.id !== id)); toast.success("Removed"); }
    catch { toast.error("Failed"); }
  };

  // Offer CRUD
  const handleOfferSubmit = async () => {
    if (!offerForm.title) return toast.error("Title required");
    try {
      const fd = new FormData();
      Object.entries(offerForm).forEach(([k, v]) => v && fd.append(k, v));
      if (editingOfferId) { await offersAPI.update(editingOfferId, fd); toast.success("Offer updated"); }
      else { await offersAPI.create(fd); toast.success("Offer created"); }
      setShowOfferForm(false); setEditingOfferId(null); setOfferForm(EMPTY_OFFER_FORM);
      loadTabData("offers");
    } catch { toast.error("Failed"); }
  };
  const deleteOffer = async (id) => {
    try { await offersAPI.delete(id); setOffers(prev => prev.filter(o => o.id !== id)); toast.success("Removed"); }
    catch { toast.error("Failed"); }
  };

  // Job CRUD
  const handleJobSubmit = async () => {
    if (!jobForm.title) return toast.error("Title required");
    try {
      if (editingJobId) { await careersAPI.updateJob(editingJobId, jobForm); toast.success("Job updated"); }
      else { await careersAPI.createJob(jobForm); toast.success("Job created"); }
      setShowJobForm(false); setEditingJobId(null); setJobForm(EMPTY_JOB_FORM);
      loadTabData("applications");
    } catch { toast.error("Failed"); }
  };
  const deleteJob = async (id) => {
    try { await careersAPI.deleteJob(id); setJobs(prev => prev.filter(j => j.id !== id)); toast.success("Removed"); }
    catch { toast.error("Failed"); }
  };

  // Settings save
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await settingsAPI.update(settingsForm);
      if (logoFile) {
        const fd = new FormData(); fd.append("logo", logoFile);
        await settingsAPI.uploadLogo(fd);
      }
      toast.success("Settings saved");
      loadTabData("settings");
    } catch { toast.error("Failed to save settings"); }
    finally { setSavingSettings(false); }
  };

  const logout = () => { localStorage.removeItem("ss_token"); localStorage.removeItem("ss_user"); router.push("/"); };

  if (!user) return null;

  // ── SHARED FORM RENDERER ─────────────────────────────────────────────────
  const FInput = ({ label, value, onChange, type = "text", placeholder }) => (
    <div>
      <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 4, textTransform: "uppercase" }}>{label}</label>
      <input className="salon-input" type={type} placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
  const FTextarea = ({ label, value, onChange, rows = 2, placeholder }) => (
    <div>
      <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 4, textTransform: "uppercase" }}>{label}</label>
      <textarea className="salon-input" rows={rows} placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", paddingTop: 70, background: "#0a0a0a" }}>
      {/* Sidebar */}
      <aside style={{ width: 170, background: "#080808", borderRight: "1px solid rgba(201,168,76,0.1)", position: "fixed", top: 70, bottom: 0, overflowY: "auto", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 12px", borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
          <div className="font-cinzel text-muted" style={{ fontSize: 8, letterSpacing: 3, marginBottom: 2 }}>ADMIN PANEL</div>
          <div className="font-playfair text-cream" style={{ fontSize: 13 }}>{user?.name}</div>
        </div>
        <nav style={{ flex: 1, padding: "8px" }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "9px 10px", borderRadius: 4, marginBottom: 2, cursor: "pointer",
                fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, textTransform: "uppercase",
                textAlign: "left", border: "none",
                borderLeft: tab === id ? "2px solid #C9A84C" : "2px solid transparent",
                background: tab === id ? "rgba(201,168,76,0.08)" : "transparent",
                color: tab === id ? "#C9A84C" : "#9B8B7A",
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px", borderTop: "1px solid rgba(201,168,76,0.08)" }}>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 8, color: "#9B8B7A", fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 2, cursor: "pointer", background: "none", border: "none", width: "100%" }}>
            <LogOut size={13} /> LOGOUT
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 170, flex: 1, padding: "28px 28px", overflowX: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}><Loader size={28} className="text-gold animate-spin" /></div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            {tab === "overview" && stats && (
              <div>
                <h2 className="font-playfair text-cream" style={{ fontSize: 22, marginBottom: 20 }}>Dashboard Overview</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    ["Total Bookings", stats.stats.total_bookings, CalendarDays],
                    ["Today's Bookings", stats.stats.today_bookings, CalendarDays],
                    ["Total Revenue", `₹${Number(stats.stats.total_revenue).toLocaleString("en-IN")}`, TrendingUp],
                    ["Pending Payments", stats.stats.pending_payments, CreditCard],
                    ["Unread Messages", stats.stats.unread_contacts, MessageSquare],
                    ["New Applications", stats.stats.new_applications, Briefcase],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="glass-card" style={{ padding: 16, borderRadius: 4 }}>
                      <Icon size={18} className="text-gold" style={{ marginBottom: 8 }} />
                      <div className="font-playfair text-cream" style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
                      <div className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
                    </div>
                  ))}
                </div>
                {stats.top_services?.length > 0 && (
                  <div className="glass-card" style={{ padding: 18, borderRadius: 4, marginBottom: 14 }}>
                    <div className="font-playfair text-cream" style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                      <BarChart3 size={16} className="text-gold" /> Top Services
                    </div>
                    {stats.top_services.map(s => (
                      <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                        <span className="font-lora text-cream" style={{ fontSize: 13 }}>{s.name}</span>
                        <div style={{ display: "flex", gap: 20 }}>
                          <span className="font-cinzel text-muted" style={{ fontSize: 10 }}>{s.bookings} bookings</span>
                          <span className="font-cinzel text-gold" style={{ fontSize: 10 }}>₹{Number(s.revenue).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── BOOKINGS ─────────────────────────────────────────────── */}
            {tab === "bookings" && (
              <div>
                <h2 className="font-playfair text-cream" style={{ fontSize: 22, marginBottom: 16 }}>All Bookings</h2>
                <div className="glass-card" style={{ overflowX: "auto", borderRadius: 4 }}>
                  <table className="salon-table">
                    <thead><tr>{["Ref","Customer","Service","Sub-Service","Date","Amount","Advance","Status","Action"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td className="font-cinzel text-gold" style={{ fontSize: 10 }}>{b.booking_ref}</td>
                          <td><div className="text-cream">{b.customer_name}</div><div className="text-muted" style={{ fontSize: 10 }}>{b.customer_email}</div></td>
                          <td className="text-cream">{b.service_name}</td>
                          <td className="text-muted" style={{ fontSize: 11 }}>{b.sub_service_name || "—"}</td>
                          <td className="text-muted">{b.booking_date ? format(new Date(b.booking_date), "MMM d") : "—"}</td>
                          <td className="text-cream font-bold">₹{b.total_amount || b.amount}</td>
                          <td style={{ color: "#C9A84C", fontSize: 12 }}>₹{b.paid_amount || "—"}</td>
                          <td><span className="badge" style={{ background: STATUS_COLORS[b.status] || "#9B8B7A", color: "#fff" }}>{b.status}</span></td>
                          <td>
                            <select value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)}
                              style={{ background: "#0a0a0a", border: "1px solid rgba(201,168,76,0.2)", color: "#9B8B7A", fontSize: 10, padding: "4px 6px", borderRadius: 4, fontFamily: "'Cinzel',serif", cursor: "pointer" }}>
                              {["pending","confirmed","completed","cancelled"].map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── SERVICES ─────────────────────────────────────────────── */}
            {tab === "services" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 className="font-playfair text-cream" style={{ fontSize: 22 }}>Manage Services</h2>
                  <button onClick={() => { setShowSvcForm(true); setEditingSvcId(null); setServiceForm(EMPTY_SERVICE_FORM); }} className="btn-gold" style={{ padding: "8px 16px", fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}><Plus size={12} /> Add Service</button>
                </div>
                {showSvcForm && (
                  <div className="glass-card" style={{ padding: 18, borderRadius: 4, marginBottom: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <FInput label="Name *" value={serviceForm.name} onChange={e => setServiceForm(p => ({...p, name: e.target.value}))} placeholder="Service name" />
                      <FInput label="Price ₹ *" type="number" value={serviceForm.price} onChange={e => setServiceForm(p => ({...p, price: e.target.value}))} placeholder="599" />
                      <FInput label="Duration (min) *" type="number" value={serviceForm.duration} onChange={e => setServiceForm(p => ({...p, duration: e.target.value}))} placeholder="45" />
                      <FInput label="Icon (emoji)" value={serviceForm.icon} onChange={e => setServiceForm(p => ({...p, icon: e.target.value}))} placeholder="✂️" />
                      <div>
                        <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Category</label>
                        <select className="salon-input" value={serviceForm.category} onChange={e => setServiceForm(p => ({...p, category: e.target.value}))}>
                          {["Hair","Grooming","Skin","Special"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: "1/-1" }}>
                        <FTextarea label="Description" value={serviceForm.description} onChange={e => setServiceForm(p => ({...p, description: e.target.value}))} placeholder="Service description" />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleServiceSubmit} className="btn-gold" style={{ padding: "8px 18px", fontSize: 10 }}>{editingSvcId ? "Update" : "Create"}</button>
                      <button onClick={() => setShowSvcForm(false)} className="btn-outline" style={{ padding: "7px 16px", fontSize: 10 }}>Cancel</button>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {services.map(s => (
                    <div key={s.id} className="glass-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 28 }}>{s.icon}</span>
                        <div><div className="font-playfair text-cream">{s.name}</div><div className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2 }}>{s.duration} MIN · ₹{s.price} · {s.category}</div></div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditingSvcId(s.id); setServiceForm({ name: s.name, description: s.description||"", price: s.price, duration: s.duration, icon: s.icon||"✂️", category: s.category||"Hair" }); setShowSvcForm(true); }} className="btn-outline" style={{ padding: "5px 12px", fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><Edit size={10} /> Edit</button>
                        <button onClick={() => servicesAPI.delete(s.id).then(() => { setServices(prev => prev.filter(x => x.id !== s.id)); toast.success("Deactivated"); }).catch(() => toast.error("Failed"))} style={{ border: "1px solid #C62828", color: "#C62828", background: "transparent", padding: "5px 12px", fontSize: 9, fontFamily: "'Cinzel',serif", letterSpacing: 1, cursor: "pointer", borderRadius: 2, display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={10} /> Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SUB-SERVICES (NEW) ────────────────────────────────────── */}
            {tab === "sub_services" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 className="font-playfair text-cream" style={{ fontSize: 22 }}>Sub-Services</h2>
                  <button onClick={() => { setShowSubForm(true); setEditingSubId(null); setSubForm(EMPTY_SUB_FORM); }} className="btn-gold" style={{ padding: "8px 16px", fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}><Plus size={12} /> Add Sub-Service</button>
                </div>
                {showSubForm && (
                  <div className="glass-card" style={{ padding: 18, borderRadius: 4, marginBottom: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Parent Service *</label>
                        <select className="salon-input" value={subForm.service_id} onChange={e => setSubForm(p => ({...p, service_id: e.target.value}))}>
                          <option value="">Select service...</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <FInput label="Sub-Service Name *" value={subForm.name} onChange={e => setSubForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Layer Cut" />
                      <FInput label="Price ₹ *" type="number" value={subForm.price} onChange={e => setSubForm(p => ({...p, price: e.target.value}))} placeholder="499" />
                      <FInput label="Duration (min)" type="number" value={subForm.duration} onChange={e => setSubForm(p => ({...p, duration: e.target.value}))} placeholder="30" />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleSubSubmit} className="btn-gold" style={{ padding: "8px 18px", fontSize: 10 }}>{editingSubId ? "Update" : "Create"}</button>
                      <button onClick={() => setShowSubForm(false)} className="btn-outline" style={{ padding: "7px 16px", fontSize: 10 }}>Cancel</button>
                    </div>
                  </div>
                )}
                <div className="glass-card" style={{ overflowX: "auto", borderRadius: 4 }}>
                  <table className="salon-table">
                    <thead><tr><th>Parent Service</th><th>Sub-Service</th><th>Price</th><th>Duration</th><th>Action</th></tr></thead>
                    <tbody>
                      {subSvcs.map(ss => (
                        <tr key={ss.id}>
                          <td className="text-muted">{ss.service_name}</td>
                          <td className="text-cream">{ss.name}</td>
                          <td className="text-gold font-bold">₹{ss.price}</td>
                          <td className="text-muted">{ss.duration ? `${ss.duration} min` : "—"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => { setEditingSubId(ss.id); setSubForm({ service_id: ss.service_id, name: ss.name, price: ss.price, duration: ss.duration||"" }); setShowSubForm(true); }} className="btn-outline" style={{ padding: "4px 10px", fontSize: 9 }}>Edit</button>
                              <button onClick={() => subServicesAPI.delete(ss.id).then(() => { setSubSvcs(prev => prev.filter(x => x.id !== ss.id)); toast.success("Removed"); }).catch(() => toast.error("Failed"))} style={{ border: "1px solid #C62828", color: "#C62828", background: "none", padding: "4px 10px", fontSize: 9, fontFamily: "'Cinzel',serif", cursor: "pointer", borderRadius: 2 }}>Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── PAYMENTS (MODIFIED: shows method + fee) ──────────────── */}
            {tab === "payments" && (
              <div>
                <h2 className="font-playfair text-cream" style={{ fontSize: 22, marginBottom: 16 }}>Payments</h2>
                {pendingUpi.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div className="font-cinzel text-gold" style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>Pending UPI Verifications</div>
                    {pendingUpi.map(p => (
                      <div key={p.id} className="glass-card" style={{ padding: 14, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 4, borderColor: "rgba(201,168,76,0.25)" }}>
                        <div>
                          <div className="font-playfair text-cream">{p.customer_name} — {p.service_name}</div>
                          <div className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 1, marginTop: 3 }}>{p.booking_ref} · ₹{p.amount}</div>
                          {p.upi_screenshot_url && (
                            <a href={`${(process.env.NEXT_PUBLIC_API_URL||"").replace("/api","")}${p.upi_screenshot_url}`} target="_blank" rel="noreferrer" className="font-cinzel text-gold" style={{ fontSize: 9, letterSpacing: 1, textDecoration: "underline" }}>View Screenshot →</a>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleUpiVerify(p.id, true)} style={{ background: "#2E7D32", border: "none", color: "#fff", padding: "7px 14px", fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={12} /> Approve</button>
                          <button onClick={() => handleUpiVerify(p.id, false)} style={{ background: "#C62828", border: "none", color: "#fff", padding: "7px 14px", fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><XCircle size={12} /> Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="glass-card" style={{ overflowX: "auto", borderRadius: 4 }}>
                  <table className="salon-table">
                    <thead><tr>{["Customer","Service","Amount","Method","Fee","Status","Date"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id}>
                          <td className="text-cream">{p.customer_name}</td>
                          <td className="text-muted">{p.service_name}</td>
                          <td className="text-gold font-bold">₹{p.amount}</td>
                          <td><span className="badge badge-muted">{p.payment_method || p.method}</span></td>
                          <td className="text-muted" style={{ fontSize: 11 }}>{p.fee_applied > 0 ? `₹${p.fee_applied}` : "—"}</td>
                          <td><span className="badge" style={{ background: STATUS_COLORS[p.status] || "#9B8B7A", color: "#fff" }}>{p.status}</span></td>
                          <td className="text-muted" style={{ fontSize: 11 }}>{p.created_at ? format(new Date(p.created_at), "MMM d") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── COURSES (MODIFIED: delete + offer_price) ─────────────── */}
            {tab === "courses" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 className="font-playfair text-cream" style={{ fontSize: 22 }}>Manage Courses</h2>
                  <button onClick={() => { setShowCourseForm(true); setEditingCourseId(null); setCourseForm(EMPTY_COURSE_FORM); }} className="btn-gold" style={{ padding: "8px 16px", fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}><Plus size={12} /> Add Course</button>
                </div>
                {showCourseForm && (
                  <div className="glass-card" style={{ padding: 18, borderRadius: 4, marginBottom: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div style={{ gridColumn: "1/-1" }}><FInput label="Title *" value={courseForm.title} onChange={e => setCourseForm(p => ({...p, title: e.target.value}))} placeholder="Course title" /></div>
                      <FInput label="Price ₹ *" type="number" value={courseForm.price} onChange={e => setCourseForm(p => ({...p, price: e.target.value}))} placeholder="4999" />
                      <FInput label="Offer Price ₹" type="number" value={courseForm.offer_price} onChange={e => setCourseForm(p => ({...p, offer_price: e.target.value}))} placeholder="3999 (optional)" />
                      <FInput label="Duration (hrs)" type="number" value={courseForm.duration_hrs} onChange={e => setCourseForm(p => ({...p, duration_hrs: e.target.value}))} placeholder="8" />
                      <FInput label="Lessons" type="number" value={courseForm.lesson_count} onChange={e => setCourseForm(p => ({...p, lesson_count: e.target.value}))} placeholder="12" />
                      <FInput label="Tag" value={courseForm.tag} onChange={e => setCourseForm(p => ({...p, tag: e.target.value}))} placeholder="BESTSELLER" />
                      <FInput label="Video URL" value={courseForm.video_url} onChange={e => setCourseForm(p => ({...p, video_url: e.target.value}))} placeholder="https://..." />
                      <div style={{ gridColumn: "1/-1" }}><FTextarea label="Description" value={courseForm.description} onChange={e => setCourseForm(p => ({...p, description: e.target.value}))} placeholder="Course description" /></div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleCourseSubmit} className="btn-gold" style={{ padding: "8px 18px", fontSize: 10 }}>{editingCourseId ? "Update" : "Create"}</button>
                      <button onClick={() => setShowCourseForm(false)} className="btn-outline" style={{ padding: "7px 16px", fontSize: 10 }}>Cancel</button>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {courses.map(c => (
                    <div key={c.id} className="glass-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 4 }}>
                      <div>
                        <div className="font-playfair text-cream" style={{ fontSize: 15 }}>{c.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                          {c.offer_price ? (
                            <>
                              <span style={{ textDecoration: "line-through", color: "#9B8B7A", fontSize: 12 }}>₹{c.price}</span>
                              <span className="font-cinzel text-gold" style={{ fontSize: 13, fontWeight: 700 }}>₹{c.offer_price}</span>
                              <span className="badge badge-gold" style={{ fontSize: 8 }}>OFFER</span>
                            </>
                          ) : (
                            <span className="font-cinzel text-gold" style={{ fontSize: 13 }}>₹{c.price}</span>
                          )}
                          {c.tag && <span className="badge badge-muted">{c.tag}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditingCourseId(c.id); setCourseForm({ title: c.title, description: c.description||"", price: c.price, offer_price: c.offer_price||"", duration_hrs: c.duration_hrs||"", lesson_count: c.lesson_count||"", tag: c.tag||"", video_url: c.video_url||"" }); setShowCourseForm(true); }} className="btn-outline" style={{ padding: "5px 12px", fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><Edit size={10} /> Edit</button>
                        <button onClick={() => deleteCourse(c.id)} style={{ border: "1px solid #C62828", color: "#C62828", background: "none", padding: "5px 12px", fontSize: 9, fontFamily: "'Cinzel',serif", cursor: "pointer", borderRadius: 2, display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={10} /> Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── OFFERS (NEW) ─────────────────────────────────────────── */}
            {tab === "offers" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 className="font-playfair text-cream" style={{ fontSize: 22 }}>Homepage Offers</h2>
                  <button onClick={() => { setShowOfferForm(true); setEditingOfferId(null); setOfferForm(EMPTY_OFFER_FORM); }} className="btn-gold" style={{ padding: "8px 16px", fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}><Plus size={12} /> Add Offer</button>
                </div>
                {showOfferForm && (
                  <div className="glass-card" style={{ padding: 18, borderRadius: 4, marginBottom: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <FInput label="Title *" value={offerForm.title} onChange={e => setOfferForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Summer Special" />
                      <FInput label="Discount" value={offerForm.discount} onChange={e => setOfferForm(p => ({...p, discount: e.target.value}))} placeholder="e.g. 20% OFF" />
                      <FInput label="Image URL" value={offerForm.image_url} onChange={e => setOfferForm(p => ({...p, image_url: e.target.value}))} placeholder="https://..." />
                      <div style={{ gridColumn: "1/-1" }}><FTextarea label="Description" value={offerForm.description} onChange={e => setOfferForm(p => ({...p, description: e.target.value}))} placeholder="Offer details" /></div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleOfferSubmit} className="btn-gold" style={{ padding: "8px 18px", fontSize: 10 }}>{editingOfferId ? "Update" : "Create"}</button>
                      <button onClick={() => setShowOfferForm(false)} className="btn-outline" style={{ padding: "7px 16px", fontSize: 10 }}>Cancel</button>
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                  {offers.map(o => (
                    <div key={o.id} className="glass-card" style={{ padding: 16, borderRadius: 4 }}>
                      {o.image_url && <img src={o.image_url} alt={o.title} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 4, marginBottom: 10 }} />}
                      <div className="font-playfair text-cream" style={{ fontSize: 15, marginBottom: 4 }}>{o.title}</div>
                      {o.discount && <span className="badge badge-gold" style={{ marginBottom: 6 }}>{o.discount}</span>}
                      {o.description && <p className="font-lora text-muted" style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>{o.description}</p>}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditingOfferId(o.id); setOfferForm({ title: o.title, description: o.description||"", discount: o.discount||"", image_url: o.image_url||"" }); setShowOfferForm(true); }} className="btn-outline" style={{ padding: "5px 12px", fontSize: 9 }}>Edit</button>
                        <button onClick={() => deleteOffer(o.id)} style={{ border: "1px solid #C62828", color: "#C62828", background: "none", padding: "5px 12px", fontSize: 9, fontFamily: "'Cinzel',serif", cursor: "pointer", borderRadius: 2 }}>Delete</button>
                      </div>
                    </div>
                  ))}
                  {offers.length === 0 && <p className="font-lora text-muted" style={{ fontSize: 13 }}>No offers yet. Add your first offer above.</p>}
                </div>
              </div>
            )}

            {/* ── CONTACTS (unchanged) ─────────────────────────────────── */}
            {tab === "contacts" && (
              <div>
                <h2 className="font-playfair text-cream" style={{ fontSize: 22, marginBottom: 16 }}>Contact Messages</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {contacts.map(c => (
                    <div key={c.id} onClick={() => !c.is_read && markContactRead(c.id)}
                      className="glass-card" style={{ padding: 16, borderRadius: 4, cursor: "pointer", borderColor: !c.is_read ? "rgba(201,168,76,0.25)" : undefined }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div><span className="font-cinzel text-cream" style={{ fontSize: 11, letterSpacing: 2 }}>{c.name}</span><span className="font-lora text-muted" style={{ fontSize: 11, marginLeft: 10 }}>{c.email}</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {!c.is_read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C" }} />}
                          <span className="font-lora text-muted" style={{ fontSize: 11 }}>{c.created_at ? format(new Date(c.created_at), "MMM d, h:mm a") : ""}</span>
                        </div>
                      </div>
                      {c.subject && <div className="font-cinzel text-gold" style={{ fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>{c.subject}</div>}
                      <p className="font-lora text-cream" style={{ fontSize: 12, lineHeight: 1.5 }}>{c.message}</p>
                    </div>
                  ))}
                  {contacts.length === 0 && <p className="font-lora text-muted">No messages yet.</p>}
                </div>
              </div>
            )}

            {/* ── CAREERS (MODIFIED: job CRUD) ─────────────────────────── */}
            {tab === "applications" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 className="font-playfair text-cream" style={{ fontSize: 22 }}>Careers</h2>
                  <button onClick={() => { setShowJobForm(true); setEditingJobId(null); setJobForm(EMPTY_JOB_FORM); }} className="btn-gold" style={{ padding: "8px 16px", fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}><Plus size={12} /> Add Job</button>
                </div>

                {/* Job listings management */}
                <div className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>Job Listings</div>
                {showJobForm && (
                  <div className="glass-card" style={{ padding: 18, borderRadius: 4, marginBottom: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <FInput label="Title *" value={jobForm.title} onChange={e => setJobForm(p => ({...p, title: e.target.value}))} placeholder="Senior Hair Stylist" />
                      <div>
                        <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Type</label>
                        <select className="salon-input" value={jobForm.type} onChange={e => setJobForm(p => ({...p, type: e.target.value}))}>
                          <option>Full-time</option><option>Part-time</option><option>Contract</option>
                        </select>
                      </div>
                      <FInput label="Experience" value={jobForm.experience} onChange={e => setJobForm(p => ({...p, experience: e.target.value}))} placeholder="3+ years" />
                      <FInput label="Salary" value={jobForm.salary} onChange={e => setJobForm(p => ({...p, salary: e.target.value}))} placeholder="₹30,000 – ₹50,000/mo" />
                      <div style={{ gridColumn: "1/-1" }}><FTextarea label="Description" value={jobForm.description} onChange={e => setJobForm(p => ({...p, description: e.target.value}))} placeholder="Role description" /></div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleJobSubmit} className="btn-gold" style={{ padding: "8px 18px", fontSize: 10 }}>{editingJobId ? "Update" : "Create"}</button>
                      <button onClick={() => setShowJobForm(false)} className="btn-outline" style={{ padding: "7px 16px", fontSize: 10 }}>Cancel</button>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                  {jobs.map(j => (
                    <div key={j.id} className="glass-card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 4 }}>
                      <div>
                        <div className="font-playfair text-cream" style={{ fontSize: 14 }}>{j.title}</div>
                        <div className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 1 }}>{j.type} · {j.experience} · {j.salary}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditingJobId(j.id); setJobForm({ title: j.title, type: j.type, experience: j.experience||"", salary: j.salary||"", description: j.description||"" }); setShowJobForm(true); }} className="btn-outline" style={{ padding: "4px 10px", fontSize: 9 }}>Edit</button>
                        <button onClick={() => deleteJob(j.id)} style={{ border: "1px solid #C62828", color: "#C62828", background: "none", padding: "4px 10px", fontSize: 9, fontFamily: "'Cinzel',serif", cursor: "pointer", borderRadius: 2 }}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Applications */}
                <div className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>Applications</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {applications.map(a => (
                    <div key={a.id} className="glass-card" style={{ padding: 16, borderRadius: 4, display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div className="font-playfair text-cream" style={{ fontSize: 15 }}>{a.name}</div>
                          <div className="font-cinzel text-gold" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>{a.job_title}</div>
                          <div className="font-lora text-muted" style={{ fontSize: 11 }}>{a.email} · {a.phone}</div>
                          {a.experience && <div className="font-lora text-muted" style={{ fontSize: 11 }}>Exp: {a.experience}</div>}
                          {a.cover_letter && <p className="font-lora text-cream" style={{ fontSize: 11, marginTop: 6, maxWidth: 400, lineHeight: 1.5 }}>{a.cover_letter.slice(0, 120)}{a.cover_letter.length > 120 ? "..." : ""}</p>}
                          {a.resume_url && <a href={`${(process.env.NEXT_PUBLIC_API_URL||"").replace("/api","")}${a.resume_url}`} target="_blank" rel="noreferrer" className="font-cinzel text-gold" style={{ fontSize: 9, letterSpacing: 1, textDecoration: "underline", marginTop: 4, display: "block" }}>Download Resume →</a>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span className="badge" style={{ background: STATUS_COLORS[a.status] || "#9B8B7A", color: "#fff" }}>{a.status}</span>
                          <select value={a.status} onChange={e => careersAPI.updateApplication(a.id, e.target.value).then(() => setApps(prev => prev.map(x => x.id === a.id ? {...x, status: e.target.value} : x))).catch(() => toast.error("Failed"))}
                            style={{ background: "#0a0a0a", border: "1px solid rgba(201,168,76,0.2)", color: "#9B8B7A", fontSize: 10, padding: "4px 6px", borderRadius: 4, fontFamily: "'Cinzel',serif", cursor: "pointer" }}>
                            {["new","reviewed","shortlisted","rejected"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {applications.length === 0 && <p className="font-lora text-muted" style={{ fontSize: 13 }}>No applications yet.</p>}
                </div>
              </div>
            )}

            {/* ── USERS (unchanged) ────────────────────────────────────── */}
            {tab === "users" && (
              <div>
                <h2 className="font-playfair text-cream" style={{ fontSize: 22, marginBottom: 16 }}>All Users</h2>
                <div className="glass-card" style={{ overflowX: "auto", borderRadius: 4 }}>
                  <table className="salon-table">
                    <thead><tr>{["Name","Email","Phone","Role","Joined"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="text-cream">{u.name}</td>
                          <td className="text-muted">{u.email}</td>
                          <td className="text-muted">{u.phone || "—"}</td>
                          <td><span className={`badge ${u.role === "admin" ? "badge-gold" : "badge-muted"}`}>{u.role}</span></td>
                          <td className="text-muted" style={{ fontSize: 11 }}>{u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── SETTINGS (NEW) ───────────────────────────────────────── */}
            {tab === "settings" && (
              <div style={{ maxWidth: 540 }}>
                <h2 className="font-playfair text-cream" style={{ fontSize: 22, marginBottom: 20 }}>Salon Settings</h2>
                <div className="glass-card" style={{ padding: 24, borderRadius: 4, marginBottom: 16 }}>
                  <div className="font-cinzel text-gold" style={{ fontSize: 10, letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>Branding</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 5, textTransform: "uppercase" }}>Salon Name</label>
                      <input className="salon-input" value={settingsForm.salon_name} onChange={e => setSettingsForm(p => ({...p, salon_name: e.target.value}))} placeholder="SmartSalon" />
                    </div>
                    <div>
                      <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 5, textTransform: "uppercase" }}>Logo Image</label>
                      {siteSettings.logo_url && (
                        <img src={siteSettings.logo_url} alt="Current logo" style={{ height: 40, marginBottom: 8, objectFit: "contain", background: "#111", padding: 4, borderRadius: 4 }} />
                      )}
                      <label style={{ display: "flex", alignItems: "center", gap: 10, border: "1px dashed rgba(201,168,76,0.3)", padding: 12, borderRadius: 4, cursor: "pointer" }}>
                        <span className="font-lora text-muted" style={{ fontSize: 12 }}>{logoFile ? logoFile.name : "Click to upload new logo (PNG/JPG)"}</span>
                        <input type="file" style={{ display: "none" }} accept=".png,.jpg,.jpeg,.svg" onChange={e => setLogoFile(e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="glass-card" style={{ padding: 24, borderRadius: 4, marginBottom: 20 }}>
                  <div className="font-cinzel text-gold" style={{ fontSize: 10, letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>Contact Info</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 5, textTransform: "uppercase" }}>UPI ID</label>
                      <input className="salon-input" value={settingsForm.upi_id} onChange={e => setSettingsForm(p => ({...p, upi_id: e.target.value}))} placeholder="smartsalon@upi" />
                    </div>
                    <div>
                      <label className="font-cinzel text-muted" style={{ fontSize: 9, letterSpacing: 2, display: "block", marginBottom: 5, textTransform: "uppercase" }}>WhatsApp Number (with country code)</label>
                      <input className="salon-input" value={settingsForm.whatsapp_number} onChange={e => setSettingsForm(p => ({...p, whatsapp_number: e.target.value}))} placeholder="919876543210" />
                    </div>
                  </div>
                </div>
                <button onClick={saveSettings} disabled={savingSettings} className="btn-gold" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {savingSettings ? <Loader size={14} className="animate-spin" /> : null}
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
