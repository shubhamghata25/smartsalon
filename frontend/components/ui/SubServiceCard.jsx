"use client";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function SubServiceCard({ subService, showBookBtn = true }) {
  return (
    <div className="luxury-card rounded-sm overflow-hidden group">
      {subService.image_url && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={subService.image_url}
            alt={subService.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent" />
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-playfair text-sm sm:text-base text-cream group-hover:text-gold transition-colors font-semibold">
            {subService.name}
          </h4>
          <span className="font-playfair text-base font-bold text-gold ml-2 shrink-0">
            ₹{subService.price}
          </span>
        </div>
        {subService.duration && (
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={10} className="text-gold/50" />
            <span className="font-cinzel text-[8px] tracking-widest text-cream/40">{subService.duration} MIN</span>
          </div>
        )}
        {subService.description && (
          <p className="font-lora text-xs text-cream/55 leading-relaxed mb-3">
            {subService.description}
          </p>
        )}
        {showBookBtn && (
          <Link
            href={`/booking?service=${subService.service_id}&sub=${subService.id}`}
            className="btn-gold !py-2 !px-4 !text-[9px] w-full text-center block"
          >
            Book Now
          </Link>
        )}
      </div>
    </div>
  );
}
