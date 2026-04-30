"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  adminAPI, bookingsAPI, servicesAPI, subServicesAPI, paymentsAPI,
  contactsAPI, careersAPI, coursesAPI, offersAPI, settingsAPI,
  videosAPI, uploadAPI, categoriesAPI,
} from "@/lib/api";
import HeroMediaSection from "@/components/admin/HeroMediaSection";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  LayoutDashboard, CalendarDays, Scissors, CreditCard,
  MessageSquare, Users, Briefcase, LogOut, TrendingUp,
  Loader, CheckCircle, XCircle, Edit, Trash2, Plus,
  Gift, Settings, BookOpen, Tag, Video, Layers, Upload, Image,
} from "lucide-react";

const TABS = [
  { id:"overview",     label:"Overview",     icon:LayoutDashboard },
  { id:"bookings",     label:"Bookings",     icon:CalendarDays    },
  { id:"categories",   label:"Categories",   icon:Layers          },
  { id:"services",     label:"Services",     icon:Scissors        },
  { id:"sub_services", label:"Sub-Services", icon:Tag             },
  { id:"payments",     label:"Payments",     icon:CreditCard      },
  { id:"courses",      label:"Courses",      icon:BookOpen        },
  { id:"offers",       label:"Offers",       icon:Gift            },
  { id:"videos",       label:"Videos",       icon:Video           },
  { id:"contacts",     label:"Messages",     icon:MessageSquare   },
  { id:"applications", label:"Careers",      icon:Briefcase       },
  { id:"users",        label:"Users",        icon:Users           },
  { id:"settings",     label:"Settings",     icon:Settings        },
];

const SC = { confirmed:"#2E7D32", pending:"#9B8B7A", completed:"#C9A84C",
             cancelled:"#C62828", success:"#2E7D32", failed:"#C62828",
             new:"#C9A84C", reviewed:"#9B8B7A", shortlisted:"#2E7D32", rejected:"#C62828" };

const EMPTY = {
  svc:  { name:"", description:"", price:"", price_min:"", price_max:"", duration:"", slot_duration:"30", icon:"✂️", category:"", category_id:"", image_url:"", sort_order:0 },
  sub:  { service_id:"", name:"", price:"", duration:"", discount_price:"", description:"", image_url:"", sort_order:0 },
  cat:  { name:"", description:"", image_url:"", sort_order:0 },
  crs:  { title:"", description:"", price:"", offer_price:"", duration_hrs:"", lesson_count:"", tag:"", video_url:"" },
  off:  { title:"", description:"", discount:"", image_url:"", expiry_date:"" },
  job:  { title:"", type:"Full-time", experience:"", salary:"", description:"" },
  vid:  { title:"", url:"", thumbnail_url:"", platform:"instagram", sort_order:0 },
  set:  { salon_name:"", upi_id:"", whatsapp_number:"", footer_tagline:"", footer_address:"", footer_phone:"", footer_email:"", instagram_url:"" },
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab]   = useState("overview");
  const [loading, setLoading] = useState(true);

  const [stats,        setStats]        = useState(null);
  const [bookings,     setBookings]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [services,     setServices]     = useState([]);
  const [subSvcs,      setSubSvcs]      = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [pendingUpi,   setPendingUpi]   = useState([]);
  const [contacts,     setContacts]     = useState([]);
  const [applications, setApps]         = useState([]);
  const [users,        setUsers]        = useState([]);
  const [courses,      setCourses]      = useState([]);
  const [offers,       setOffers]       = useState([]);
  const [jobs,         setJobs]         = useState([]);
  const [videos,       setVideos]       = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [heroMedia,    setHeroMedia]    = useState({ url: "", type: "image" });

  // Form states
  const [forms,     setForms]     = useState(EMPTY);
  const [editingId, setEditingId] = useState({});
  const [showForm,  setShowForm]  = useState({});
  const [uploading, setUploading] = useState(false);
  const [savingSet, setSavingSet] = useState(false);
  const [logoFile,  setLogoFile]  = useState(null);

  const setF = (key, val) => setForms(p => ({ ...p, [key]: val }));
  const toggleForm = (key, id=null, initial=null) => {
    setShowForm(p => ({ ...p, [key]: !p[key] }));
    setEditingId(p => ({ ...p, [key]: id }));
    if (initial) setF(key, initial);
    else if (!showForm[key]) setF(key, EMPTY[key]);
  };

  useEffect(() => {
    const u = localStorage.getItem("ss_user");
    if (!u) { router.push("/login"); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== "admin") { toast.error("Admin access required"); router.push("/"); return; }
    setUser(parsed);
  }, [router]);

  const load = useCallback(async (t) => {
    setLoading(true);
    try {
      switch (t) {
        case "overview": {
          const { data } = await adminAPI.dashboard(); setStats(data); break;
        }
        case "bookings": {
          const { data } = await bookingsAPI.list(); setBookings(data); break;
        }
        case "categories": {
          const { data } = await categoriesAPI.list(); setCategories(data); break;
        }
        case "services": {
          const [{ data: sv }, { data: cats }] = await Promise.all([servicesAPI.list(), categoriesAPI.list()]);
          setServices(sv); setCategories(cats); break;
        }
        case "sub_services": {
          const [{ data: sub }, { data: sv }] = await Promise.all([subServicesAPI.all(), servicesAPI.list()]);
          setSubSvcs(sub); setServices(sv); break;
        }
        case "payments": {
          const [allP, pendP] = await Promise.all([paymentsAPI.list(), paymentsAPI.pendingUpi()]);
          setPayments(allP.data); setPendingUpi(pendP.data); break;
        }
        case "courses": {
          const { data } = await coursesAPI.list(); setCourses(data); break;
        }
        case "offers": {
          const { data } = await offersAPI.all(); setOffers(data); break;
        }
        case "videos": {
          const { data } = await videosAPI.list(); setVideos(data); break;
        }
        case "contacts": {
          const { data } = await contactsAPI.list(); setContacts(data); break;
        }
        case "applications": {
          const [{ data: ap }, { data: jb }] = await Promise.all([careersAPI.applications(), careersAPI.jobs()]);
          setApps(ap); setJobs(jb); break;
        }
        case "users": {
          const { data } = await adminAPI.users(); setUsers(data); break;
        }
        case "settings": {
          const { data } = await settingsAPI.get();
          setSiteSettings(data);
          setHeroMedia({ url: data.hero_media_url || "", type: data.hero_media_type || "image" });
          setF("set", { salon_name:data.salon_name||"", upi_id:data.upi_id||"", whatsapp_number:data.whatsapp_number||"",
            footer_tagline:data.footer_tagline||"", footer_address:data.footer_address||"",
            footer_phone:data.footer_phone||"", footer_email:data.footer_email||"",
            instagram_url:data.instagram_url||"" });
          break;
        }
      }
    } catch (e) { toast.error("Failed to load: " + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) load(tab); }, [tab, user, load]);

  /* ── IMAGE UPLOAD HELPER ─────────────────────────────────── */
  const uploadImage = async (file, folder="lonaz-luxe/general") => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await uploadAPI.image(fd, folder);
      return data.url;
    } catch (e) {
      toast.error("Upload failed: " + e.message);
      return null;
    } finally { setUploading(false); }
  };

  /* ── CRUD HELPERS ────────────────────────────────────────── */
  const crudSave = async (key, createFn, updateFn, reloadTab) => {
    try {
      if (editingId[key]) await updateFn(editingId[key], forms[key]);
      else await createFn(forms[key]);
      toast.success(editingId[key] ? "Updated" : "Created");
      toggleForm(key);
      load(reloadTab || key);
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
  };

  const updateBookingStatus = async (id, status) => {
    try { await bookingsAPI.updateStatus(id, status); setBookings(p => p.map(b => b.id===id ? {...b,status} : b)); }
    catch { toast.error("Failed"); }
  };
  const handleUpiVerify = async (id, approved) => {
    try { await paymentsAPI.verifyManual(id, { approved }); setPendingUpi(p => p.filter(x => x.id!==id)); toast.success(approved?"Approved":"Rejected"); }
    catch { toast.error("Failed"); }
  };
  const markRead = async (id) => {
    try { await contactsAPI.markRead(id); setContacts(p => p.map(c => c.id===id ? {...c,is_read:true} : c)); }
    catch {}
  };

  const saveSettings = async () => {
    setSavingSet(true);
    try {
      await settingsAPI.update(forms.set);
      if (logoFile) {
        const fd = new FormData(); fd.append("logo", logoFile);
        await settingsAPI.uploadLogo(fd);
      }
      toast.success("Settings saved"); load("settings");
    } catch { toast.error("Failed"); }
    finally { setSavingSet(false); }
  };

  const logout = () => { localStorage.removeItem("ss_token"); localStorage.removeItem("ss_user"); router.push("/"); };

  if (!user) return null;

  /* ── SHARED FORM INPUT ───────────────────────────────────── */
  const FI = ({ label, fKey, subKey, type="text", ph="", required=false }) => (
    <div>
      <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">{label}{required&&" *"}</label>
      <input type={type} className="salon-input text-sm" placeholder={ph}
        value={forms[fKey][subKey]||""}
        onChange={e => setF(fKey, {...forms[fKey],[subKey]:e.target.value})} />
    </div>
  );
  const FTA = ({ label, fKey, subKey, ph="" }) => (
    <div>
      <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">{label}</label>
      <textarea rows={2} className="salon-input text-sm" placeholder={ph}
        value={forms[fKey][subKey]||""}
        onChange={e => setF(fKey, {...forms[fKey],[subKey]:e.target.value})} />
    </div>
  );
  const ImgUpload = ({ fKey, subKey, folder }) => (
    <div>
      <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">Image</label>
      <div className="flex gap-2">
        <input className="salon-input text-sm flex-1" placeholder="https://... or upload →" value={forms[fKey][subKey]||""}
          onChange={e => setF(fKey,{...forms[fKey],[subKey]:e.target.value})} />
        <label className="btn-outline !py-2 !px-3 cursor-pointer shrink-0 flex items-center gap-1">
          {uploading ? <Loader size={12} className="animate-spin" /> : <Upload size={12} />}
          <input type="file" className="hidden" accept="image/*" onChange={async e => {
            const url = await uploadImage(e.target.files[0], folder);
            if (url) setF(fKey,{...forms[fKey],[subKey]:url});
          }} />
        </label>
      </div>
      {forms[fKey][subKey] && <img src={forms[fKey][subKey]} alt="" className="mt-2 h-16 rounded object-cover" />}
    </div>
  );

  const FormPanel = ({ title, onSave, onCancel, children }) => (
    <div className="glass-card p-5 rounded-sm mb-5">
      <div className="font-playfair text-base text-cream mb-4">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">{children}</div>
      <div className="flex gap-2">
        <button onClick={onSave} className="btn-gold !py-2 !px-5 !text-[10px]">Save</button>
        <button onClick={onCancel} className="btn-outline !py-2 !px-4 !text-[10px]">Cancel</button>
      </div>
    </div>
  );

  const AddBtn = ({ label, onClick }) => (
    <button onClick={onClick} className="btn-gold !py-2 !px-4 !text-[10px] flex items-center gap-1.5">
      <Plus size={12} /> {label}
    </button>
  );

  const EditBtn = ({ onClick }) => (
    <button onClick={onClick} className="btn-outline !py-1.5 !px-3 !text-[9px] flex items-center gap-1"><Edit size={10}/> Edit</button>
  );
  const DelBtn = ({ onClick }) => (
    <button onClick={onClick} style={{ border:"1px solid #C62828", color:"#C62828", background:"none", padding:"6px 12px", fontSize:9, fontFamily:"'Cinzel',serif", cursor:"pointer", borderRadius:2, display:"flex", alignItems:"center", gap:4 }}><Trash2 size={10}/> Del</button>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", paddingTop:70, background:"#061a12" }}>
      {/* ── SIDEBAR ───────────────────────────────────────── */}
      <aside style={{ width:168, background:"rgba(10,42,33,.95)", borderRight:"1px solid rgba(201,168,76,.1)", position:"fixed", top:70, bottom:0, overflowY:"auto", zIndex:40, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 12px", borderBottom:"1px solid rgba(201,168,76,.08)" }}>
          <div className="font-cinzel text-[8px] tracking-[3px] text-gold/40 mb-1">ADMIN PANEL</div>
          <div className="font-playfair text-sm text-cream">{user?.name}</div>
        </div>
        <nav style={{ flex:1, padding:8, overflowY:"auto" }}>
          {TABS.map(({ id, label, icon:Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:7, padding:"8px 10px",
              borderRadius:4, marginBottom:2, cursor:"pointer", fontFamily:"'Cinzel',serif",
              fontSize:9, letterSpacing:1, textTransform:"uppercase", textAlign:"left", border:"none",
              borderLeft:`2px solid ${tab===id?"#C9A84C":"transparent"}`,
              background: tab===id ? "rgba(201,168,76,.08)" : "transparent",
              color: tab===id ? "#C9A84C" : "#9B8B7A",
            }}>
              <Icon size={12}/> {label}
            </button>
          ))}
        </nav>
        <div style={{ padding:10, borderTop:"1px solid rgba(201,168,76,.08)" }}>
          <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:7, color:"#9B8B7A", fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:2, cursor:"pointer", background:"none", border:"none", width:"100%" }}>
            <LogOut size={12}/> LOGOUT
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────── */}
      <main style={{ marginLeft:168, flex:1, padding:"24px 24px", overflowX:"auto", minWidth:0 }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Loader size={26} className="text-gold animate-spin"/></div>
        ) : (
          <>

          {/* ─── OVERVIEW ──────────────────────────────── */}
          {tab==="overview" && stats && (
            <div>
              <h2 className="font-playfair text-xl text-cream mb-6">Dashboard Overview</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
                {[
                  ["Total Bookings",stats.stats.total_bookings,CalendarDays],
                  ["Today's Bookings",stats.stats.today_bookings,CalendarDays],
                  [`₹${Number(stats.stats.total_revenue||0).toLocaleString("en-IN")}`,null,TrendingUp,"Total Revenue"],
                  ["Pending Payments",stats.stats.pending_payments,CreditCard],
                  ["Unread Messages",stats.stats.unread_contacts,MessageSquare],
                  ["New Applications",stats.stats.new_applications,Briefcase],
                ].map(([val,_,Icon,lbl],i)=>(
                  <div key={i} className="glass-card p-5 rounded-sm">
                    <Icon size={18} className="text-gold mb-2"/>
                    <div className="font-playfair text-xl text-cream font-bold">{val}</div>
                    <div className="font-cinzel text-[9px] tracking-[2px] text-gold/40 uppercase mt-1">{lbl||val}</div>
                  </div>
                ))}
              </div>
              {stats.top_services?.length>0 && (
                <div className="glass-card p-5 rounded-sm mb-5">
                  <div className="font-playfair text-base text-cream mb-4">Top Services</div>
                  {stats.top_services.map(s=>(
                    <div key={s.name} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(201,168,76,.06)" }}>
                      <span className="font-lora text-sm text-cream">{s.name}</span>
                      <div style={{ display:"flex", gap:16 }}>
                        <span className="font-cinzel text-[10px] text-gold/50">{s.bookings} bookings</span>
                        <span className="font-cinzel text-[10px] text-gold">₹{Number(s.revenue||0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── BOOKINGS ───────────────────────────────── */}
          {tab==="bookings" && (
            <div>
              <h2 className="font-playfair text-xl text-cream mb-5">All Bookings</h2>
              <div className="glass-card rounded-sm overflow-x-auto">
                <table className="salon-table">
                  <thead><tr>{["Ref","Customer","Service","Date","Total","Advance","Status","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {bookings.map(b=>(
                      <tr key={b.id}>
                        <td className="font-cinzel text-[10px] text-gold">{b.booking_ref}</td>
                        <td><div className="text-cream text-sm">{b.customer_name}</div><div className="text-gold/40 text-xs">{b.customer_email}</div></td>
                        <td className="text-sm">{b.service_name}</td>
                        <td className="text-gold/50 text-xs">{b.booking_date ? format(new Date(b.booking_date),"MMM d") : "—"}</td>
                        <td className="text-gold font-bold text-sm">₹{b.total_amount||b.amount}</td>
                        <td className="text-cream/60 text-xs">₹{b.paid_amount||"—"}</td>
                        <td><span className="badge text-[8px]" style={{background:SC[b.status]||"#9B8B7A",color:"#fff"}}>{b.status}</span></td>
                        <td>
                          <select value={b.status} onChange={e=>updateBookingStatus(b.id,e.target.value)}
                            style={{background:"#061a12",border:"1px solid rgba(201,168,76,.2)",color:"#9B8B7A",fontSize:10,padding:"4px 6px",borderRadius:4,fontFamily:"'Cinzel',serif",cursor:"pointer"}}>
                            {["pending","confirmed","completed","cancelled"].map(s=><option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── CATEGORIES ─────────────────────────────── */}
          {tab==="categories" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 className="font-playfair text-xl text-cream">Categories</h2>
                <AddBtn label="Add Category" onClick={()=>toggleForm("cat")} />
              </div>
              {showForm.cat && (
                <FormPanel title={editingId.cat?"Edit Category":"New Category"}
                  onSave={()=>crudSave("cat",categoriesAPI.create,(id,d)=>categoriesAPI.update(id,d),"categories")}
                  onCancel={()=>toggleForm("cat")}>
                  <FI label="Name" fKey="cat" subKey="name" required ph="e.g. Women"/>
                  <FI label="Sort Order" fKey="cat" subKey="sort_order" type="number"/>
                  <div className="sm:col-span-2"><FTA label="Description" fKey="cat" subKey="description" ph="Short description"/></div>
                  <div className="sm:col-span-2"><ImgUpload fKey="cat" subKey="image_url" folder="lonaz-luxe/categories"/></div>
                </FormPanel>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                {categories.map(c=>(
                  <div key={c.id} className="glass-card rounded-sm overflow-hidden">
                    {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-28 object-cover"/>}
                    <div className="p-4">
                      <div className="font-playfair text-sm text-cream mb-1">{c.name}</div>
                      {c.description && <div className="font-lora text-xs text-gold/50 mb-3">{c.description}</div>}
                      <div style={{display:"flex",gap:6}}>
                        <EditBtn onClick={()=>toggleForm("cat",c.id,{name:c.name,description:c.description||"",image_url:c.image_url||"",sort_order:c.sort_order||0})}/>
                        <DelBtn onClick={()=>categoriesAPI.delete(c.id).then(()=>{setCategories(p=>p.filter(x=>x.id!==c.id));toast.success("Removed")}).catch(()=>toast.error("Failed"))}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── SERVICES ───────────────────────────────── */}
          {tab==="services" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 className="font-playfair text-xl text-cream">Services</h2>
                <AddBtn label="Add Service" onClick={()=>toggleForm("svc")}/>
              </div>
              {showForm.svc && (
                <FormPanel title={editingId.svc?"Edit Service":"New Service"}
                  onSave={()=>crudSave("svc",servicesAPI.create,(id,d)=>servicesAPI.update(id,d),"services")}
                  onCancel={()=>toggleForm("svc")}>
                  <FI label="Name" fKey="svc" subKey="name" required ph="Service name"/>
                  <FI label="Price ₹ (base)" fKey="svc" subKey="price" type="number" ph="599"/>
                  <FI label="Price Range Min ₹" fKey="svc" subKey="price_min" type="number" ph="199"/>
                  <FI label="Price Range Max ₹" fKey="svc" subKey="price_max" type="number" ph="2999"/>
                  <FI label="Duration (min)" fKey="svc" subKey="duration" type="number" ph="45"/>
                  <FI label="Slot Duration (min)" fKey="svc" subKey="slot_duration" type="number" ph="30" />
                  <FI label="Icon (emoji)" fKey="svc" subKey="icon" ph="✂️"/>
                  <div>
                    <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">Category</label>
                    <select className="salon-input text-sm" value={forms.svc.category_id||""}
                      onChange={e=>setF("svc",{...forms.svc,category_id:e.target.value})}>
                      <option value="">No category</option>
                      {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <FI label="Sort Order" fKey="svc" subKey="sort_order" type="number"/>
                  <div className="sm:col-span-2"><FTA label="Description" fKey="svc" subKey="description" ph="Service description"/></div>
                  <div className="sm:col-span-2"><ImgUpload fKey="svc" subKey="image_url" folder="lonaz-luxe/services"/></div>
                </FormPanel>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {services.map(s=>(
                  <div key={s.id} className="glass-card p-4 rounded-sm flex justify-between items-center">
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {s.image_url ? <img src={s.image_url} alt={s.name} className="w-12 h-12 rounded object-cover"/> : <span style={{fontSize:28}}>{s.icon}</span>}
                      <div>
                        <div className="font-playfair text-sm text-cream">{s.name}</div>
                        <div className="font-cinzel text-[9px] tracking-[1px] text-gold/50">{s.duration} MIN · ₹{s.price} · {s.category_name||s.category||"—"}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <EditBtn onClick={()=>toggleForm("svc",s.id,{name:s.name,description:s.description||"",price:s.price,price_min:s.price_min||"",price_max:s.price_max||"",duration:s.duration,slot_duration:s.slot_duration||30,icon:s.icon||"✂️",category:s.category||"",category_id:s.category_id||"",image_url:s.image_url||"",sort_order:s.sort_order||0})}/>
                      <DelBtn onClick={()=>servicesAPI.delete(s.id).then(()=>{setServices(p=>p.filter(x=>x.id!==s.id));toast.success("Removed")}).catch(()=>toast.error("Failed"))}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── SUB-SERVICES ───────────────────────────── */}
          {tab==="sub_services" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 className="font-playfair text-xl text-cream">Sub-Services</h2>
                <AddBtn label="Add Sub-Service" onClick={()=>toggleForm("sub")}/>
              </div>
              {showForm.sub && (
                <FormPanel title={editingId.sub?"Edit Sub-Service":"New Sub-Service"}
                  onSave={()=>crudSave("sub",subServicesAPI.create,(id,d)=>subServicesAPI.update(id,d),"sub_services")}
                  onCancel={()=>toggleForm("sub")}>
                  <div>
                    <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">Parent Service *</label>
                    <select className="salon-input text-sm" value={forms.sub.service_id||""}
                      onChange={e=>setF("sub",{...forms.sub,service_id:e.target.value})}>
                      <option value="">Select service...</option>
                      {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <FI label="Sub-Service Name" fKey="sub" subKey="name" required ph="e.g. Fade Cut"/>
                  <FI label="Price ₹" fKey="sub" subKey="price" type="number" ph="499"/>
                  <FI label="Discount Price ₹ (optional)" fKey="sub" subKey="discount_price" type="number" ph="399"/>
                  <FI label="Duration (min)" fKey="sub" subKey="duration" type="number" ph="30"/>
                  <FI label="Sort Order" fKey="sub" subKey="sort_order" type="number"/>
                  <div className="sm:col-span-2"><FTA label="Description" fKey="sub" subKey="description" ph="Style details, what's included..."/></div>
                  <div className="sm:col-span-2"><ImgUpload fKey="sub" subKey="image_url" folder="lonaz-luxe/sub-services"/></div>
                </FormPanel>
              )}
              <div className="glass-card rounded-sm overflow-x-auto">
                <table className="salon-table">
                  <thead><tr>{["Parent","Name","Price","Discount","Duration","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {subSvcs.map(ss=>(
                      <tr key={ss.id}>
                        <td className="text-gold/50 text-sm">{ss.service_name}</td>
                        <td className="text-cream text-sm">{ss.name}</td>
                        <td className="text-gold font-bold">₹{ss.price}</td>
                        <td className="text-green-400 text-xs">{ss.discount_price?`₹${ss.discount_price}`:"—"}</td>
                        <td className="text-gold/50 text-xs">{ss.duration?`${ss.duration} min`:"—"}</td>
                        <td><div style={{display:"flex",gap:6}}>
                          <EditBtn onClick={()=>toggleForm("sub",ss.id,{service_id:ss.service_id,name:ss.name,price:ss.price,duration:ss.duration||"",discount_price:ss.discount_price||"",description:ss.description||"",image_url:ss.image_url||"",sort_order:ss.sort_order||0})}/>
                          <DelBtn onClick={()=>subServicesAPI.delete(ss.id).then(()=>{setSubSvcs(p=>p.filter(x=>x.id!==ss.id));toast.success("Removed")}).catch(()=>toast.error("Failed"))}/>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── PAYMENTS ───────────────────────────────── */}
          {tab==="payments" && (
            <div>
              <h2 className="font-playfair text-xl text-cream mb-5">Payments</h2>
              {pendingUpi.length>0 && (
                <div className="mb-6">
                  <div className="font-cinzel text-[9px] tracking-[3px] text-gold/60 mb-3 uppercase">Pending UPI Verifications</div>
                  {pendingUpi.map(p=>(
                    <div key={p.id} className="glass-card p-4 mb-3 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="font-playfair text-sm text-cream">{p.customer_name} — {p.service_name}</div>
                        <div className="font-cinzel text-[9px] tracking-[1px] text-gold/50 mt-1">{p.booking_ref} · ₹{p.amount}</div>
                        {p.upi_screenshot_url && <a href={`${(process.env.NEXT_PUBLIC_API_URL||"").replace("/api","")}${p.upi_screenshot_url}`} target="_blank" rel="noreferrer" className="font-cinzel text-[9px] text-gold underline">View Screenshot →</a>}
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button onClick={()=>handleUpiVerify(p.id,true)} style={{background:"#2E7D32",border:"none",color:"#fff",padding:"7px 14px",fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:1,borderRadius:2,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><CheckCircle size={11}/> Approve</button>
                        <button onClick={()=>handleUpiVerify(p.id,false)} style={{background:"#C62828",border:"none",color:"#fff",padding:"7px 14px",fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:1,borderRadius:2,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><XCircle size={11}/> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="glass-card rounded-sm overflow-x-auto">
                <table className="salon-table">
                  <thead><tr>{["Customer","Service","Amount","Method","Fee","Status","Date"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {payments.map(p=>(
                      <tr key={p.id}>
                        <td className="text-cream text-sm">{p.customer_name}</td>
                        <td className="text-gold/50 text-sm">{p.service_name}</td>
                        <td className="text-gold font-bold">₹{p.amount}</td>
                        <td><span className="badge badge-muted text-[8px]">{p.payment_method||p.method}</span></td>
                        <td className="text-gold/40 text-xs">{p.fee_applied>0?`₹${p.fee_applied}`:"—"}</td>
                        <td><span className="badge text-[8px]" style={{background:SC[p.status]||"#9B8B7A",color:"#fff"}}>{p.status}</span></td>
                        <td className="text-gold/40 text-xs">{p.created_at?format(new Date(p.created_at),"MMM d"):"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── COURSES ────────────────────────────────── */}
          {tab==="courses" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 className="font-playfair text-xl text-cream">Courses</h2>
                <AddBtn label="Add Course" onClick={()=>toggleForm("crs")}/>
              </div>
              {showForm.crs && (
                <FormPanel title={editingId.crs?"Edit Course":"New Course"}
                  onSave={()=>crudSave("crs",coursesAPI.create,(id,d)=>coursesAPI.update(id,d),"courses")}
                  onCancel={()=>toggleForm("crs")}>
                  <div className="sm:col-span-2"><FI label="Title" fKey="crs" subKey="title" required ph="Course title"/></div>
                  <FI label="Price ₹" fKey="crs" subKey="price" type="number" ph="4999"/>
                  <FI label="Offer Price ₹" fKey="crs" subKey="offer_price" type="number" ph="3999 (optional)"/>
                  <FI label="Duration (hrs)" fKey="crs" subKey="duration_hrs" type="number" ph="8"/>
                  <FI label="Lessons" fKey="crs" subKey="lesson_count" type="number" ph="12"/>
                  <FI label="Tag" fKey="crs" subKey="tag" ph="BESTSELLER"/>
                  <FI label="Video URL" fKey="crs" subKey="video_url" ph="https://..."/>
                  <div className="sm:col-span-2"><FTA label="Description" fKey="crs" subKey="description" ph="Course description"/></div>
                </FormPanel>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {courses.map(c=>(
                  <div key={c.id} className="glass-card p-4 rounded-sm flex justify-between items-center">
                    <div>
                      <div className="font-playfair text-sm text-cream">{c.title}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                        {c.offer_price ? (<><span className="font-cinzel text-[10px] text-gold">₹{c.offer_price}</span><span className="font-cinzel text-[9px] text-gold/40 line-through">₹{c.price}</span><span className="badge badge-gold text-[7px]">OFFER</span></>) : <span className="font-cinzel text-[10px] text-gold">₹{c.price}</span>}
                        {c.tag && <span className="badge badge-muted text-[8px]">{c.tag}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <EditBtn onClick={()=>toggleForm("crs",c.id,{title:c.title,description:c.description||"",price:c.price,offer_price:c.offer_price||"",duration_hrs:c.duration_hrs||"",lesson_count:c.lesson_count||"",tag:c.tag||"",video_url:c.video_url||""})}/>
                      <DelBtn onClick={()=>coursesAPI.delete(c.id).then(()=>{setCourses(p=>p.filter(x=>x.id!==c.id));toast.success("Removed")}).catch(()=>toast.error("Failed"))}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── OFFERS ─────────────────────────────────── */}
          {tab==="offers" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 className="font-playfair text-xl text-cream">Homepage Offers</h2>
                <AddBtn label="Add Offer" onClick={()=>toggleForm("off")}/>
              </div>
              {showForm.off && (
                <FormPanel title={editingId.off?"Edit Offer":"New Offer"}
                  onSave={async ()=>{
                    const fd = new FormData();
                    Object.entries(forms.off).forEach(([k,v])=>{ if(v) fd.append(k,v); });
                    try {
                      if(editingId.off) await offersAPI.update(editingId.off,fd);
                      else await offersAPI.create(fd);
                      toast.success("Saved"); toggleForm("off"); load("offers");
                    } catch(e){ toast.error(e.response?.data?.error||"Failed"); }
                  }}
                  onCancel={()=>toggleForm("off")}>
                  <FI label="Title" fKey="off" subKey="title" required ph="e.g. Summer Special"/>
                  <FI label="Discount" fKey="off" subKey="discount" ph="e.g. 20% OFF"/>
                  <FI label="Expiry Date" fKey="off" subKey="expiry_date" type="date"/>
                  <div className="sm:col-span-2"><FTA label="Description" fKey="off" subKey="description" ph="Offer details..."/></div>
                  <div className="sm:col-span-2"><ImgUpload fKey="off" subKey="image_url" folder="lonaz-luxe/offers"/></div>
                </FormPanel>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
                {offers.map(o=>(
                  <div key={o.id} className="glass-card rounded-sm overflow-hidden">
                    {o.image_url && <img src={o.image_url} alt={o.title} className="w-full h-32 object-cover"/>}
                    <div className="p-4">
                      <div className="font-playfair text-sm text-cream mb-1">{o.title}</div>
                      {o.discount && <span className="badge badge-gold text-[8px] mb-2 inline-block">{o.discount}</span>}
                      {o.expiry_date && <div className="font-cinzel text-[8px] text-gold/40 mb-2">Expires: {new Date(o.expiry_date).toLocaleDateString("en-IN")}</div>}
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                        <span className="badge text-[8px]" style={{background:o.is_active?"#2E7D32":"#C62828",color:"#fff"}}>{o.is_active?"Active":"Inactive"}</span>
                        <button onClick={()=>offersAPI.update(o.id,JSON.stringify({is_active:!o.is_active})).then(()=>load("offers")).catch(()=>{})} className="font-cinzel text-[8px] text-gold/50 underline cursor-pointer border-none bg-transparent">Toggle</button>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <EditBtn onClick={()=>toggleForm("off",o.id,{title:o.title,description:o.description||"",discount:o.discount||"",image_url:o.image_url||"",expiry_date:o.expiry_date?o.expiry_date.split("T")[0]:""})}/>
                        <DelBtn onClick={()=>offersAPI.delete(o.id).then(()=>{setOffers(p=>p.filter(x=>x.id!==o.id));toast.success("Removed")}).catch(()=>toast.error("Failed"))}/>
                      </div>
                    </div>
                  </div>
                ))}
                {offers.length===0 && <p className="font-lora text-sm text-cream/40 col-span-full py-10 text-center">No offers yet. Add your first offer above.</p>}
              </div>
            </div>
          )}

          {/* ─── VIDEOS ─────────────────────────────────── */}
          {tab==="videos" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 className="font-playfair text-xl text-cream">Instagram / Videos</h2>
                <AddBtn label="Add Video" onClick={()=>toggleForm("vid")}/>
              </div>
              {showForm.vid && (
                <FormPanel title={editingId.vid?"Edit Video":"New Video"}
                  onSave={()=>crudSave("vid",videosAPI.create,(id,d)=>videosAPI.update(id,d),"videos")}
                  onCancel={()=>toggleForm("vid")}>
                  <FI label="Title" fKey="vid" subKey="title" ph="e.g. Bridal Transformation"/>
                  <div>
                    <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">Platform</label>
                    <select className="salon-input text-sm" value={forms.vid.platform}
                      onChange={e=>setF("vid",{...forms.vid,platform:e.target.value})}>
                      {["instagram","youtube","facebook","tiktok"].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2"><FI label="Video URL *" fKey="vid" subKey="url" ph="https://youtube.com/watch?v=... or https://instagram.com/p/..."/></div>
                  <div className="sm:col-span-2"><ImgUpload fKey="vid" subKey="thumbnail_url" folder="lonaz-luxe/video-thumbs"/></div>
                  <FI label="Sort Order" fKey="vid" subKey="sort_order" type="number"/>
                </FormPanel>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                {videos.map(v=>(
                  <div key={v.id} className="glass-card rounded-sm overflow-hidden">
                    {v.thumbnail_url ? <img src={v.thumbnail_url} alt={v.title||"Video"} className="w-full h-28 object-cover"/> :
                      <div className="h-28 flex items-center justify-center" style={{background:"rgba(15,59,47,.6)"}}><Video size={28} className="text-gold/40"/></div>}
                    <div className="p-4">
                      <div className="font-playfair text-sm text-cream mb-1">{v.title||"Video"}</div>
                      <div className="font-cinzel text-[8px] tracking-[1px] text-gold/40 uppercase mb-2">{v.platform}</div>
                      <a href={v.url} target="_blank" rel="noreferrer" className="font-cinzel text-[9px] text-gold underline block mb-2 truncate">Open Link →</a>
                      <div style={{display:"flex",gap:6}}>
                        <EditBtn onClick={()=>toggleForm("vid",v.id,{title:v.title||"",url:v.url,thumbnail_url:v.thumbnail_url||"",platform:v.platform||"instagram",sort_order:v.sort_order||0})}/>
                        <DelBtn onClick={()=>videosAPI.delete(v.id).then(()=>{setVideos(p=>p.filter(x=>x.id!==v.id));toast.success("Removed")}).catch(()=>toast.error("Failed"))}/>
                      </div>
                    </div>
                  </div>
                ))}
                {videos.length===0 && <p className="font-lora text-sm text-cream/40 col-span-full py-10 text-center">No videos yet. Add Instagram or YouTube URLs above.</p>}
              </div>
            </div>
          )}

          {/* ─── CONTACTS ───────────────────────────────── */}
          {tab==="contacts" && (
            <div>
              <h2 className="font-playfair text-xl text-cream mb-5">Contact Messages</h2>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {contacts.map(c=>(
                  <div key={c.id} onClick={()=>!c.is_read&&markRead(c.id)}
                    className="glass-card p-5 rounded-sm cursor-pointer" style={{borderColor:!c.is_read?"rgba(201,168,76,.3)":undefined}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <div><span className="font-cinzel text-[10px] tracking-[2px] text-cream">{c.name}</span><span className="font-lora text-xs text-gold/40 ml-3">{c.email}</span></div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {!c.is_read && <div style={{width:6,height:6,borderRadius:"50%",background:"#C9A84C"}}/>}
                        <span className="font-lora text-xs text-gold/30">{c.created_at?format(new Date(c.created_at),"MMM d, h:mm a"):""}</span>
                      </div>
                    </div>
                    {c.subject && <div className="font-cinzel text-[9px] tracking-[2px] text-gold mb-2">{c.subject}</div>}
                    <p className="font-lora text-sm text-cream/75 leading-relaxed">{c.message}</p>
                  </div>
                ))}
                {contacts.length===0 && <p className="font-lora text-sm text-cream/40 py-10 text-center">No messages yet.</p>}
              </div>
            </div>
          )}

          {/* ─── CAREERS ────────────────────────────────── */}
          {tab==="applications" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 className="font-playfair text-xl text-cream">Careers</h2>
                <AddBtn label="Add Job" onClick={()=>toggleForm("job")}/>
              </div>
              {showForm.job && (
                <FormPanel title={editingId.job?"Edit Job":"New Job"}
                  onSave={()=>crudSave("job",careersAPI.createJob,(id,d)=>careersAPI.updateJob(id,d),"applications")}
                  onCancel={()=>toggleForm("job")}>
                  <FI label="Title" fKey="job" subKey="title" required ph="Senior Hair Stylist"/>
                  <div>
                    <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">Type</label>
                    <select className="salon-input text-sm" value={forms.job.type}
                      onChange={e=>setF("job",{...forms.job,type:e.target.value})}>
                      {["Full-time","Part-time","Contract"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <FI label="Experience" fKey="job" subKey="experience" ph="3+ years"/>
                  <FI label="Salary" fKey="job" subKey="salary" ph="₹30,000 – ₹50,000/mo"/>
                  <div className="sm:col-span-2"><FTA label="Description" fKey="job" subKey="description" ph="Role description"/></div>
                </FormPanel>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
                {jobs.map(j=>(
                  <div key={j.id} className="glass-card p-4 rounded-sm flex justify-between items-center">
                    <div>
                      <div className="font-playfair text-sm text-cream">{j.title}</div>
                      <div className="font-cinzel text-[9px] tracking-[1px] text-gold/50">{j.type} · {j.experience} · {j.salary}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <EditBtn onClick={()=>toggleForm("job",j.id,{title:j.title,type:j.type||"Full-time",experience:j.experience||"",salary:j.salary||"",description:j.description||""})}/>
                      <DelBtn onClick={()=>careersAPI.deleteJob(j.id).then(()=>{setJobs(p=>p.filter(x=>x.id!==j.id));toast.success("Removed")}).catch(()=>toast.error("Failed"))}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="font-cinzel text-[9px] tracking-[3px] text-gold/40 mb-4 uppercase">Applications</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {applications.map(a=>(
                  <div key={a.id} className="glass-card p-5 rounded-sm flex flex-col sm:flex-row justify-between gap-3">
                    <div>
                      <div className="font-playfair text-sm text-cream">{a.name}</div>
                      <div className="font-cinzel text-[10px] tracking-[2px] text-gold mb-2">{a.job_title}</div>
                      <div className="font-lora text-xs text-gold/50">{a.email} · {a.phone}</div>
                      {a.experience && <div className="font-lora text-xs text-gold/40">Exp: {a.experience}</div>}
                      {a.resume_url && <a href={`${(process.env.NEXT_PUBLIC_API_URL||"").replace("/api","")}${a.resume_url}`} target="_blank" rel="noreferrer" className="font-cinzel text-[9px] text-gold underline mt-1 block">Resume →</a>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <span className="badge text-[8px]" style={{background:SC[a.status]||"#9B8B7A",color:"#fff"}}>{a.status}</span>
                      <select value={a.status}
                        onChange={e=>careersAPI.updateApplication(a.id,e.target.value).then(()=>setApps(p=>p.map(x=>x.id===a.id?{...x,status:e.target.value}:x))).catch(()=>toast.error("Failed"))}
                        style={{background:"#061a12",border:"1px solid rgba(201,168,76,.2)",color:"#9B8B7A",fontSize:10,padding:"4px 6px",borderRadius:4,fontFamily:"'Cinzel',serif",cursor:"pointer"}}>
                        {["new","reviewed","shortlisted","rejected"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── USERS ──────────────────────────────────── */}
          {tab==="users" && (
            <div>
              <h2 className="font-playfair text-xl text-cream mb-5">All Users</h2>
              <div className="glass-card rounded-sm overflow-x-auto">
                <table className="salon-table">
                  <thead><tr>{["Name","Email","Phone","Role","Joined"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map(u=>(
                      <tr key={u.id}>
                        <td className="text-cream text-sm">{u.name}</td>
                        <td className="text-gold/50 text-sm">{u.email}</td>
                        <td className="text-gold/40 text-sm">{u.phone||"—"}</td>
                        <td><span className={`badge text-[8px] ${u.role==="admin"?"badge-gold":"badge-muted"}`}>{u.role}</span></td>
                        <td className="text-gold/40 text-xs">{u.created_at?format(new Date(u.created_at),"MMM d, yyyy"):"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── SETTINGS ───────────────────────────────── */}
          {tab==="settings" && (
            <div style={{maxWidth:580}}>
              <h2 className="font-playfair text-xl text-cream mb-6">Salon Settings</h2>

              <div className="glass-card p-6 rounded-sm mb-5">
                <div className="font-cinzel text-[9px] tracking-[3px] text-gold/50 mb-4 uppercase">Branding</div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div>
                    <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">Salon Name</label>
                    <input className="salon-input text-sm" value={forms.set.salon_name||""} onChange={e=>setF("set",{...forms.set,salon_name:e.target.value})} placeholder="Lonaz Luxe Salon"/>
                  </div>
                  <div>
                    <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">Logo</label>
                    {siteSettings.logo_url && <img src={siteSettings.logo_url} alt="Logo" className="h-10 mb-2 object-contain"/>}
                    <label className="flex items-center gap-3 border border-dashed border-gold/25 p-3 rounded-sm cursor-pointer hover:border-gold/50 transition-colors">
                      <Upload size={15} className="text-gold/50"/>
                      <span className="font-lora text-xs text-cream/50">{logoFile?logoFile.name:"Click to upload logo (PNG/JPG/SVG)"}</span>
                      <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={e=>setLogoFile(e.target.files[0])}/>
                    </label>
                  </div>
                  <div>
                    <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">Footer Tagline</label>
                    <input className="salon-input text-sm" value={forms.set.footer_tagline||""} onChange={e=>setF("set",{...forms.set,footer_tagline:e.target.value})} placeholder="Where Beauty Meets Luxury"/>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-sm mb-5">
                <div className="font-cinzel text-[9px] tracking-[3px] text-gold/50 mb-4 uppercase">Contact Info</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {[
                    ["Footer Address","footer_address","123 Style Street, Mumbai"],
                    ["Footer Phone","footer_phone","+91 98765 43210"],
                    ["Footer Email","footer_email","hello@lonazluxe.in"],
                    ["WhatsApp Number","whatsapp_number","919876543210"],
                    ["UPI ID","upi_id","lonazluxe@upi"],
                    ["Instagram URL","instagram_url","https://instagram.com/lonazluxe"],
                  ].map(([label,key,ph])=>(
                    <div key={key}>
                      <label className="font-cinzel text-[9px] tracking-[2px] text-gold/50 block mb-1.5 uppercase">{label}</label>
                      <input className="salon-input text-sm" value={forms.set[key]||""} placeholder={ph}
                        onChange={e=>setF("set",{...forms.set,[key]:e.target.value})}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Background Media */}
              <div className="mt-6">
                <HeroMediaSection
                  currentUrl={heroMedia.url}
                  currentType={heroMedia.type}
                  onSaved={(data) => {
                    if (data) {
                      setHeroMedia({ url: data.url, type: data.type });
                    } else {
                      setHeroMedia({ url: "", type: "image" });
                    }
                  }}
                />
              </div>

              <button onClick={saveSettings} disabled={savingSet} className="btn-gold flex items-center gap-2 mt-6">
                {savingSet?<Loader size={14} className="animate-spin"/>:null}
                {savingSet?"Saving...":"Save All Settings"}
              </button>
            </div>
          )}

          </>
        )}
      </main>
    </div>
  );
}
