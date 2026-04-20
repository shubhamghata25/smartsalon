"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { categoriesAPI, servicesAPI, subServicesAPI } from "@/lib/api";
import CategoryCard from "@/components/ui/CategoryCard";
import ServiceCard from "@/components/ui/ServiceCard";
import SubServiceCard from "@/components/ui/SubServiceCard";
import { Loader, ChevronRight } from "lucide-react";

function ServicesMenu() {
  const searchParams = useSearchParams();
  const initCat = searchParams.get("category");

  const [categories,   setCategories]   = useState([]);
  const [services,     setServices]     = useState([]);
  const [subServices,  setSubServices]  = useState([]);
  const [activeCat,    setActiveCat]    = useState(initCat || null);
  const [activeSvc,    setActiveSvc]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [loadingSubs,  setLoadingSubs]  = useState(false);

  useEffect(() => {
    categoriesAPI.list().then(r => {
      setCategories(r.data);
      if (!initCat && r.data.length) setActiveCat(r.data[0].id);
    }).catch(() => {}).finally(() => setLoading(false));

    // Also load all services for "All" view
    servicesAPI.list().then(r => {
      if (!initCat) setServices(r.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeCat) return;
    setLoading(true);
    setActiveSvc(null);
    setSubServices([]);
    servicesAPI.list({ category_id: activeCat })
      .then(r => setServices(r.data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [activeCat]);

  const handleServiceClick = async (svc) => {
    if (activeSvc?.id === svc.id) { setActiveSvc(null); setSubServices([]); return; }
    setActiveSvc(svc);
    setLoadingSubs(true);
    subServicesAPI.byService(svc.id)
      .then(r => setSubServices(r.data))
      .catch(() => setSubServices([]))
      .finally(() => setLoadingSubs(false));
  };

  const activeCatObj = categories.find(c => c.id === activeCat);

  return (
    <div style={{ paddingTop: 70, minHeight:"100vh", background:"rgba(10,42,33,.6)" }}>
      {/* Header */}
      <div className="py-14 sm:py-16 container-pad text-center" style={{ background:"linear-gradient(180deg,rgba(10,42,33,.9),rgba(15,59,47,.5))" }}>
        <div className="section-label justify-center">
          <span className="gold-line"/><span>Lonaz Luxe Salon</span><span className="gold-line"/>
        </div>
        <h1 className="font-playfair text-[clamp(28px,5vw,56px)] font-bold text-cream">
          Our <em className="text-gold">Services</em>
        </h1>
        <p className="font-lora text-sm text-cream/50 mt-3 max-w-md mx-auto">
          Three levels of refinement — choose your category, service, and style.
        </p>
      </div>

      <div className="max-w-7xl mx-auto container-pad py-10">

        {/* ── LEVEL 1: CATEGORIES ────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="mb-10">
            <div className="font-cinzel text-[9px] tracking-[3px] text-gold/60 mb-4 uppercase">Level 1 — Category</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* All option */}
              <button
                onClick={() => { setActiveCat(null); setActiveSvc(null); setSubServices([]); servicesAPI.list().then(r => setServices(r.data)).catch(()=>{}); }}
                className={`luxury-card p-4 text-center rounded-sm transition-all ${!activeCat ? "border-gold shadow-gold-glow" : ""}`}>
                <div className="text-2xl mb-2">✨</div>
                <div className="font-cinzel text-[10px] tracking-[2px] uppercase text-cream">All Services</div>
              </button>
              {categories.map(cat => (
                <CategoryCard key={cat.id} category={cat}
                  active={activeCat === cat.id}
                  onClick={() => setActiveCat(cat.id)} />
              ))}
            </div>
          </div>
        )}

        {/* ── LEVEL 2: SERVICES ─────────────────────────────────── */}
        <div className="mb-8">
          {activeCatObj && (
            <div className="flex items-center gap-2 mb-5">
              <span className="font-cinzel text-[9px] tracking-[3px] text-gold/60 uppercase">Level 2</span>
              <ChevronRight size={12} className="text-gold/40" />
              <span className="font-cinzel text-[11px] tracking-[2px] text-gold uppercase">{activeCatObj.name}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><Loader size={28} className="text-gold animate-spin" /></div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-lora text-cream/40">No services in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map(svc => (
                <div key={svc.id} onClick={() => handleServiceClick(svc)}
                  className={`cursor-pointer transition-all duration-200 ${activeSvc?.id === svc.id ? "ring-2 ring-gold ring-offset-2 ring-offset-forest-dark rounded-sm" : ""}`}>
                  <ServiceCard service={svc} onClick={() => handleServiceClick(svc)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── LEVEL 3: SUB-SERVICES ────────────────────────────────── */}
        {activeSvc && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-cinzel text-[9px] tracking-[3px] text-gold/60 uppercase">Level 3</span>
              <ChevronRight size={12} className="text-gold/40" />
              <span className="font-cinzel text-[11px] tracking-[2px] text-gold uppercase">{activeSvc.name}</span>
            </div>

            {loadingSubs ? (
              <div className="flex justify-center py-10"><Loader size={22} className="text-gold animate-spin" /></div>
            ) : subServices.length === 0 ? (
              <div className="glass-card p-8 rounded-sm text-center">
                <p className="font-lora text-sm text-cream/40 mb-4">No sub-services available. Book the main service directly.</p>
                <a href={`/booking?service=${activeSvc.id}`} className="btn-gold !text-[10px] !py-2 !px-8">
                  Book {activeSvc.name} — ₹{activeSvc.price}
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {subServices.map(ss => (
                  <SubServiceCard key={ss.id} subService={ss} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesMenuPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh", paddingTop:70, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Loader size={28} className="text-gold animate-spin" />
      </div>
    }>
      <ServicesMenu />
    </Suspense>
  );
}
