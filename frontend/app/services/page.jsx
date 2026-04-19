"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { servicesAPI } from "@/lib/api";
import { Clock, ArrowRight, Loader } from "lucide-react";

const CATEGORIES = ["All", "Hair", "Grooming", "Skin", "Special"];

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    servicesAPI.list()
      .then(r => setServices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "All"
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <div className="min-h-screen pt-[70px]">
      {/* Header */}
      <div className="py-20 px-6 bg-gradient-to-b from-[#1a1a1a] to-[#161616] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08)_0%,transparent_60%)]" />
        <div className="relative z-10">
          <div className="section-label justify-center">
            <span className="gold-line" /><span>Our Offerings</span><span className="gold-line" />
          </div>
          <h1 className="font-playfair text-[clamp(32px,5vw,64px)] font-bold text-cream mb-4">
            Our <em className="text-gold not-italic">Services</em>
          </h1>
          <p className="font-lora text-muted max-w-md mx-auto">
            Every service is a bespoke experience — crafted to your unique style and needs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-cinzel text-[10px] tracking-[2px] px-5 py-2 border rounded-sm transition-all uppercase ${
                activeCategory === cat
                  ? "bg-gold text-charcoal border-gold"
                  : "border-gold/20 text-muted hover:border-gold/50 hover:text-cream"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader size={32} className="text-gold animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="font-lora text-muted">No services in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ service }) {
  return (
    <div className="glass-card p-8 rounded-sm group hover:border-gold/30 transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <span className="text-5xl">{service.icon}</span>
        <div className="text-right">
          <div className="font-playfair text-2xl font-bold text-gold">₹{service.price}</div>
          <div className="flex items-center justify-end gap-1 mt-1">
            <Clock size={11} className="text-muted" />
            <span className="font-cinzel text-[9px] tracking-widest text-muted">{service.duration} MIN</span>
          </div>
        </div>
      </div>

      <h3 className="font-playfair text-xl text-cream mb-2 group-hover:text-gold transition-colors">{service.name}</h3>
      {service.category && (
        <span className="badge badge-muted mb-3 w-fit">{service.category}</span>
      )}
      <p className="font-lora text-sm text-muted leading-relaxed mb-6 flex-1">{service.description}</p>

      <Link
        href={`/booking?service=${service.id}`}
        className="btn-gold !py-3 !text-[10px] text-center flex items-center justify-center gap-2"
      >
        Book This Service <ArrowRight size={14} />
      </Link>
    </div>
  );
}
