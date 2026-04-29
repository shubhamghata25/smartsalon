"use client";
import Link from "next/link";
import { Tag, Clock } from "lucide-react";

export default function OfferSection({ offers = [] }) {
  if (!offers.length) return null;

  return (
    <section className="py-16 sm:py-20 container-pad" style={{ background: "rgba(10,42,33,0.6)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="section-label justify-center">
            <span className="gold-line" />
            <span>Special Offers</span>
            <span className="gold-line" />
          </div>
          <h2 className="font-playfair text-[clamp(24px,4vw,42px)] font-bold text-cream">
            Exclusive <em className="text-gold">Deals</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map(offer => (
            <div key={offer.id}
              className="luxury-card rounded-sm overflow-hidden group flex flex-col"
            >
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-forest-dark to-forest-dark/80">
                {offer.image_url ? (
                  <img
                    src={offer.image_url}
                    alt={offer.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag size={36} className="text-gold/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent pointer-events-none" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                {offer.discount && (
                  <span className="badge badge-gold mb-3 w-fit text-[9px]">
                    <Tag size={9} className="inline mr-1" />{offer.discount}
                  </span>
                )}
                <h3 className="font-playfair text-lg text-cream group-hover:text-gold transition-colors font-bold mb-2">
                  {offer.title}
                </h3>
                {offer.description && (
                  <p className="font-lora text-xs text-cream/55 leading-relaxed mb-3 flex-1">
                    {offer.description}
                  </p>
                )}
                {offer.expiry_date && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock size={11} className="text-gold/50" />
                    <span className="font-cinzel text-[9px] text-cream/40 tracking-widest">
                      Valid till {new Date(offer.expiry_date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                    </span>
                  </div>
                )}
                <Link href="/booking"
                  className="btn-outline !py-2 !px-4 !text-[9px] text-center block mt-auto">
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
