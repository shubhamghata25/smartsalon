"use client";
/**
 * FILE: frontend/app/services-menu/page.jsx
 *
 * FIXES:
 * 1. Cloudinary images — added onError fallback so broken URLs don't crash layout
 * 3. Service filtering — selecting "Men" only shows Men services (filtered by category_id, not all)
 * 4. Category → Subcategory flow — clicking a service shows ONLY that service's subs
 * 5. Price display — category cards show range (min–max across all their services),
 *    subcategory shows exact price
 */
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { categoriesAPI, servicesAPI, subServicesAPI } from "@/lib/api";
import { Loader, ChevronRight, Clock, Tag } from "lucide-react";
import Link from "next/link";

// ── Helpers ──────────────────────────────────────────────────────────────────

function priceRange(services) {
  if (!services || !services.length) return null;
  const prices = services.map(s => parseFloat(s.price)).filter(Boolean);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
}

// ── Category pill button ──────────────────────────────────────────────────────

function CategoryPill({ category, active, onClick, priceLabel }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-sm transition-all duration-200 text-left w-full ${
        active
          ? "border-2 border-gold shadow-[0_0_20px_rgba(201,168,76,0.25)]"
          : "border border-gold/15 hover:border-gold/40"
      }`}
      style={{ background: active ? "rgba(201,168,76,0.08)" : "rgba(15,59,47,0.55)" }}
    >
      {/* Image */}
      {category.image_url ? (
        <div className="relative h-28 overflow-hidden">
          <img
            src={category.image_url}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => {
              // Hide broken image, show emoji fallback
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          {/* Hidden emoji fallback shown on image error */}
          <div
            className="absolute inset-0 items-center justify-center text-3xl"
            style={{ display: "none", background: "rgba(15,59,47,0.8)" }}
          >
            ✂️
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent" />
        </div>
      ) : (
        <div
          className="h-24 flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg,rgba(15,59,47,0.9),rgba(10,42,33,0.95))" }}
        >
          ✂️
        </div>
      )}

      <div className="p-3">
        <div className="font-cinzel text-[11px] tracking-[2px] uppercase text-cream group-hover:text-gold transition-colors mb-1">
          {category.name}
        </div>
        {priceLabel && (
          <div className="font-playfair text-[11px] text-gold/70">{priceLabel}</div>
        )}
      </div>

      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
      )}
    </button>
  );
}

// ── Service row card ──────────────────────────────────────────────────────────

function ServiceRow({ service, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-sm overflow-hidden transition-all duration-200 flex items-center gap-4 p-4 ${
        isActive
          ? "border-2 border-gold bg-[rgba(201,168,76,0.06)] shadow-[0_0_16px_rgba(201,168,76,0.2)]"
          : "border border-gold/15 hover:border-gold/35 bg-[rgba(15,59,47,0.55)] hover:bg-[rgba(15,59,47,0.75)]"
      }`}
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-14 h-14 rounded-sm overflow-hidden bg-[rgba(201,168,76,0.07)] flex items-center justify-center">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover"
            onError={e => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement.innerHTML = `<span style="font-size:22px">${service.icon || "✂️"}</span>`;
            }}
          />
        ) : (
          <span style={{ fontSize: 22 }}>{service.icon || "✂️"}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-playfair text-base text-cream group-hover:text-gold mb-0.5 truncate">
          {service.name}
        </div>
        {service.description && (
          <div className="font-lora text-xs text-cream/50 line-clamp-1">{service.description}</div>
        )}
        {service.duration && (
          <div className="flex items-center gap-1 mt-1">
            <Clock size={9} className="text-gold/40" />
            <span className="font-cinzel text-[8px] tracking-widest text-cream/35">
              {service.slot_duration || service.duration} MIN
            </span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="shrink-0 text-right">
        <div className="font-playfair text-base font-bold text-gold">₹{parseFloat(service.price).toFixed(0)}</div>
        {isActive && (
          <div className="font-cinzel text-[8px] tracking-[1px] text-gold/50 mt-0.5">TAP FOR OPTIONS</div>
        )}
      </div>
    </button>
  );
}

// ── Subcategory card ──────────────────────────────────────────────────────────

function SubCard({ sub }) {
  const original   = parseFloat(sub.price);
  const discounted = sub.discount_price ? parseFloat(sub.discount_price) : null;
  const hasOffer   = discounted && discounted < original;

  return (
    <div
      className="luxury-card rounded-sm overflow-hidden group flex flex-col"
    >
      {sub.image_url && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={sub.image_url}
            alt={sub.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.currentTarget.parentElement.style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="font-playfair text-sm text-cream font-semibold group-hover:text-gold transition-colors">
            {sub.name}
          </h4>
          {/* EXACT price at subcategory level (Fix #5) */}
          <div className="text-right shrink-0">
            {hasOffer ? (
              <>
                <div className="font-playfair text-sm font-bold text-gold">₹{discounted.toFixed(0)}</div>
                <div className="font-lora text-[10px] text-muted line-through">₹{original.toFixed(0)}</div>
              </>
            ) : (
              <div className="font-playfair text-sm font-bold text-gold">₹{original.toFixed(0)}</div>
            )}
          </div>
        </div>

        {hasOffer && (
          <div className="flex items-center gap-1 mb-2">
            <Tag size={9} className="text-green-400" />
            <span className="font-cinzel text-[8px] tracking-[1px] text-green-400">DISCOUNT APPLIED</span>
          </div>
        )}

        {sub.duration && (
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={9} className="text-gold/40" />
            <span className="font-cinzel text-[8px] tracking-widest text-cream/35">{sub.duration} MIN</span>
          </div>
        )}
        {sub.description && (
          <p className="font-lora text-xs text-cream/50 leading-relaxed mb-3 flex-1">{sub.description}</p>
        )}
        <Link
          href={`/booking?service=${sub.service_id}&sub=${sub.id}`}
          className="btn-gold !py-2 !px-4 !text-[9px] w-full text-center block mt-auto"
          onClick={e => e.stopPropagation()}
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function ServicesMenu() {
  const searchParams = useSearchParams();
  const initCat = searchParams.get("category");

  const [categories,   setCategories]   = useState([]);
  const [allServices,  setAllServices]  = useState([]); // all services from API
  const [subServices,  setSubServices]  = useState([]);
  const [activeCat,    setActiveCat]    = useState(initCat || null); // null = "All"
  const [activeSvc,    setActiveSvc]    = useState(null);
  const [loadingSubs,  setLoadingSubs]  = useState(false);
  const [initialLoad,  setInitialLoad]  = useState(true);

  // ── Load categories + ALL services once ──────────────────────────────────
  useEffect(() => {
    Promise.all([categoriesAPI.list(), servicesAPI.list()])
      .then(([cRes, sRes]) => {
        setCategories(cRes.data);
        setAllServices(sRes.data);
        // If URL has a category param, activate it
        if (initCat) setActiveCat(initCat);
      })
      .catch(() => {})
      .finally(() => setInitialLoad(false));
  }, []);

  // ── FILTER services by active category (Fix #3) ──────────────────────────
  // When a category is selected → ONLY show its services, not all
  const visibleServices = activeCat
    ? allServices.filter(s => s.category_id === activeCat)
    : allServices;

  // ── Category → price range (Fix #5) ──────────────────────────────────────
  function getCatPriceRange(catId) {
    const svcs = allServices.filter(s => s.category_id === catId);
    return priceRange(svcs);
  }

  // ── Service click → load sub-services (Fix #4) ───────────────────────────
  const handleServiceClick = async (svc) => {
    if (activeSvc?.id === svc.id) {
      setActiveSvc(null);
      setSubServices([]);
      return;
    }
    setActiveSvc(svc);
    setSubServices([]);
    setLoadingSubs(true);
    try {
      const { data } = await subServicesAPI.byService(svc.id);
      setSubServices(data);
    } catch {
      setSubServices([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  // ── Category click — reset service selection ──────────────────────────────
  const handleCatClick = (catId) => {
    setActiveCat(catId);
    setActiveSvc(null);
    setSubServices([]);
  };

  const activeCatObj = categories.find(c => c.id === activeCat);

  if (initialLoad) {
    return (
      <div style={{ minHeight: "100vh", paddingTop: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader size={28} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 70, minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="py-14 sm:py-16 px-4 text-center"
        style={{ background: "linear-gradient(180deg,rgba(10,42,33,.9),rgba(15,59,47,.5))" }}
      >
        <div className="section-label justify-center">
          <span className="gold-line" /><span>Lonaz Luxe Salon</span><span className="gold-line" />
        </div>
        <h1 className="font-playfair text-[clamp(28px,5vw,56px)] font-bold text-cream">
          Our <em className="text-gold">Services</em>
        </h1>
        <p className="font-lora text-sm text-cream/50 mt-3 max-w-md mx-auto">
          Choose your category, pick a service, then select your style.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── LEVEL 1: CATEGORY TABS (Fix #3) ─────────────────────────────── */}
        {categories.length > 0 && (
          <div className="mb-10">
            <div className="font-cinzel text-[9px] tracking-[3px] text-gold/50 mb-4 uppercase">
              Step 1 — Select Category
            </div>
            {/* Scrollable horizontal row on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* "All" option */}
              <button
                onClick={() => handleCatClick(null)}
                className={`p-4 text-center rounded-sm border transition-all duration-200 ${
                  !activeCat
                    ? "border-gold bg-[rgba(201,168,76,0.08)] shadow-[0_0_20px_rgba(201,168,76,0.2)]"
                    : "border-gold/15 hover:border-gold/35"
                }`}
                style={{ background: activeCat ? "rgba(15,59,47,0.55)" : undefined }}
              >
                <div className="text-2xl mb-2">✨</div>
                <div className="font-cinzel text-[10px] tracking-[2px] uppercase text-cream">All</div>
                {!activeCat && <div className="font-lora text-[10px] text-gold/60 mt-1">{allServices.length} services</div>}
              </button>

              {/* Category pills with price range (Fix #5) */}
              {categories.map(cat => (
                <CategoryPill
                  key={cat.id}
                  category={cat}
                  active={activeCat === cat.id}
                  onClick={() => handleCatClick(cat.id)}
                  priceLabel={getCatPriceRange(cat.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── LEVEL 2: SERVICES filtered by category (Fix #3) ─────────────── */}
        <div className="mb-8">
          {activeCatObj && (
            <div className="flex items-center gap-2 mb-5">
              <span className="font-cinzel text-[9px] tracking-[3px] text-gold/50 uppercase">Step 2</span>
              <ChevronRight size={12} className="text-gold/30" />
              <span className="font-cinzel text-[11px] tracking-[2px] text-gold uppercase">{activeCatObj.name} Services</span>
              <span className="font-lora text-xs text-cream/30 ml-1">({visibleServices.length} available)</span>
            </div>
          )}
          {!activeCatObj && allServices.length > 0 && (
            <div className="flex items-center gap-2 mb-5">
              <span className="font-cinzel text-[9px] tracking-[3px] text-gold/50 uppercase">All Services</span>
              <span className="font-lora text-xs text-cream/30 ml-1">({visibleServices.length} available)</span>
            </div>
          )}

          {visibleServices.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-sm">
              <p className="font-lora text-cream/40">No services in this category yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleServices.map(svc => (
                <ServiceRow
                  key={svc.id}
                  service={svc}
                  isActive={activeSvc?.id === svc.id}
                  onClick={() => handleServiceClick(svc)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── LEVEL 3: SUB-SERVICES for selected service (Fix #4) ─────────── */}
        {activeSvc && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-cinzel text-[9px] tracking-[3px] text-gold/50 uppercase">Step 3</span>
              <ChevronRight size={12} className="text-gold/30" />
              <span className="font-cinzel text-[11px] tracking-[2px] text-gold uppercase">{activeSvc.name}</span>
            </div>

            {loadingSubs ? (
              <div className="flex justify-center py-10">
                <Loader size={22} className="text-gold animate-spin" />
              </div>
            ) : subServices.length === 0 ? (
              <div className="glass-card p-8 rounded-sm text-center">
                <p className="font-lora text-sm text-cream/40 mb-4">
                  No sub-options for this service. Book it directly.
                </p>
                <Link
                  href={`/booking?service=${activeSvc.id}`}
                  className="btn-gold !text-[10px] !py-2 !px-8"
                >
                  Book {activeSvc.name} — ₹{parseFloat(activeSvc.price).toFixed(0)}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {subServices.map(ss => (
                  <SubCard key={ss.id} sub={ss} />
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
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", paddingTop: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader size={28} className="text-gold animate-spin" />
        </div>
      }
    >
      <ServicesMenu />
    </Suspense>
  );
}
