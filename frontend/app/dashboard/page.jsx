"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usersAPI, bookingsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { CalendarDays, BookOpen, User, LogOut, Loader, XCircle } from "lucide-react";
import Link from "next/link";

const TABS = [
  { id: "bookings", label: "My Bookings", icon: CalendarDays },
  { id: "courses", label: "My Courses", icon: BookOpen },
  { id: "profile", label: "Profile", icon: User },
];

const STATUS_STYLES = {
  confirmed: "badge-green",
  pending: "badge-muted",
  completed: "badge-gold",
  cancelled: "badge-red",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("ss_user");
    if (!u) { router.push("/login"); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setProfileForm({ name: parsed.name || "", phone: parsed.phone || "" });

    Promise.all([usersAPI.myBookings(), usersAPI.myCourses()])
      .then(([b, c]) => { setBookings(b.data); setCourses(c.data); })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [router]);

  const cancelBooking = async (id) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await bookingsAPI.cancel(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
      toast.success("Booking cancelled");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to cancel");
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await usersAPI.updateProfile(profileForm);
      const updated = { ...user, ...data };
      localStorage.setItem("ss_user", JSON.stringify(updated));
      setUser(updated);
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-[70px] bg-[#161616]">
      {/* Header */}
      <div className="bg-gradient-to-b from-charcoal to-[#161616] px-6 py-12 border-b border-gold/10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <div className="section-label">
              <span className="gold-line" /><span>My Account</span>
            </div>
            <h1 className="font-playfair text-3xl text-cream">
              Welcome, <em className="text-gold not-italic">{user.name}</em>
            </h1>
            <p className="font-lora text-sm text-muted mt-1">{user.email}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-muted hover:text-cream font-cinzel text-[10px] tracking-widest transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gold/10 mb-8 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 font-cinzel text-[10px] tracking-[2px] uppercase border-b-2 transition-all -mb-px ${
                tab === id ? "border-gold text-gold" : "border-transparent text-muted hover:text-cream"
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader size={28} className="text-gold animate-spin" /></div>
        ) : (
          <>
            {/* BOOKINGS */}
            {tab === "bookings" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-playfair text-xl text-cream">Your Appointments</h3>
                  <Link href="/booking" className="btn-gold !py-2 !px-5 !text-[10px]">+ Book New</Link>
                </div>
                {bookings.length === 0 ? (
                  <div className="text-center py-16 glass-card rounded-sm">
                    <CalendarDays size={40} className="text-muted mx-auto mb-4" />
                    <p className="font-lora text-muted mb-4">No appointments yet</p>
                    <Link href="/booking" className="btn-gold !py-2 !px-8 !text-[10px]">Book Now</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map(b => (
                      <div key={b.id} className="glass-card p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-sm bg-gold/10 flex items-center justify-center border border-gold/20">
                            <CalendarDays size={18} className="text-gold" />
                          </div>
                          <div>
                            <div className="font-playfair text-cream">{b.service_name}</div>
                            <div className="font-lora text-sm text-muted">
                              {format(new Date(b.booking_date), "MMM d, yyyy")} at {b.booking_time?.slice(0,5)}
                            </div>
                            <div className="font-cinzel text-[9px] tracking-widest text-gold">{b.booking_ref}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-playfair text-lg text-gold font-bold">₹{b.amount}</span>
                          <span className={`badge ${STATUS_STYLES[b.status] || "badge-muted"}`}>{b.status}</span>
                          {["pending","confirmed"].includes(b.status) && (
                            <button onClick={() => cancelBooking(b.id)} className="text-muted hover:text-red-400 transition-colors">
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* COURSES */}
            {tab === "courses" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-playfair text-xl text-cream">Enrolled Courses</h3>
                  <Link href="/courses" className="btn-outline !py-2 !px-5 !text-[10px]">Browse Courses</Link>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-16 glass-card rounded-sm">
                    <BookOpen size={40} className="text-muted mx-auto mb-4" />
                    <p className="font-lora text-muted mb-4">No courses enrolled yet</p>
                    <Link href="/courses" className="btn-gold !py-2 !px-8 !text-[10px]">Explore Courses</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {courses.map(c => (
                      <div key={c.id} className="glass-card p-6 rounded-sm">
                        <h4 className="font-playfair text-cream mb-2">{c.title}</h4>
                        <div className="font-cinzel text-[9px] tracking-widest text-muted mb-4">
                          {c.lesson_count} LESSONS · {c.duration_hrs}H
                        </div>
                        <Link href={`/courses/${c.id}`} className="btn-gold !py-2 !px-5 !text-[10px] block text-center">Continue Learning</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE */}
            {tab === "profile" && (
              <div className="max-w-md">
                <h3 className="font-playfair text-xl text-cream mb-6">Edit Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-cinzel text-[10px] tracking-[2px] text-muted mb-2 block">FULL NAME</label>
                    <input className="salon-input" value={profileForm.name}
                      onChange={e => setProfileForm(p => ({...p, name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="font-cinzel text-[10px] tracking-[2px] text-muted mb-2 block">EMAIL</label>
                    <input className="salon-input opacity-50" value={user.email} disabled />
                  </div>
                  <div>
                    <label className="font-cinzel text-[10px] tracking-[2px] text-muted mb-2 block">PHONE</label>
                    <input className="salon-input" value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} />
                  </div>
                  <button onClick={saveProfile} disabled={savingProfile} className="btn-gold flex items-center gap-2">
                    {savingProfile ? <Loader size={14} className="animate-spin" /> : null}
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
