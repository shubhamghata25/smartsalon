import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";
  return (
    <footer className="bg-[#111] border-t border-gold/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="font-cinzel text-2xl font-bold text-gold tracking-[5px] mb-1">SMART</div>
            <div className="font-cinzel text-[9px] tracking-[8px] text-muted mb-4">SALON</div>
            <p className="font-lora text-sm text-muted leading-relaxed">
              Premium unisex salon where every visit is a ritual of transformation and self-care.
            </p>
            <div className="flex gap-4 mt-6">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="text-muted hover:text-green-400 transition-colors"><MessageCircle size={20} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-muted hover:text-pink-400 transition-colors"><Instagram size={20} /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-cinzel text-[11px] tracking-[3px] text-gold mb-6 uppercase">Quick Links</h4>
            {[["Home","/"],["Services","/services"],["Book Appointment","/booking"],["Courses","/courses"],["Careers","/careers"]].map(([label, href]) => (
              <Link key={href} href={href} className="block font-lora text-sm text-muted hover:text-cream transition-colors mb-3">{label}</Link>
            ))}
          </div>

          {/* Services */}
          <div>
            <h4 className="font-cinzel text-[11px] tracking-[3px] text-gold mb-6 uppercase">Services</h4>
            {["Signature Haircut","Beard Sculpting","Hair Coloring","Luxury Facial","Hair Spa","Bridal Package"].map(s => (
              <p key={s} className="font-lora text-sm text-muted mb-3">{s}</p>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-cinzel text-[11px] tracking-[3px] text-gold mb-6 uppercase">Contact</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 text-muted">
                <MapPin size={15} className="mt-0.5 shrink-0 text-gold" />
                <span className="font-lora text-sm leading-relaxed">123 Style Street, Bandra West, Mumbai 400050</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <Phone size={15} className="shrink-0 text-gold" />
                <a href="tel:+919876543210" className="font-lora text-sm hover:text-cream transition-colors">+91 98765 43210</a>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <Mail size={15} className="shrink-0 text-gold" />
                <a href="mailto:hello@smartsalon.in" className="font-lora text-sm hover:text-cream transition-colors">hello@smartsalon.in</a>
              </div>
            </div>
            <div className="mt-6 p-4 border border-gold/15 rounded-sm">
              <p className="font-cinzel text-[10px] tracking-[2px] text-gold mb-2">HOURS</p>
              <p className="font-lora text-xs text-muted">Mon–Sat: 9:00 AM – 7:00 PM</p>
              <p className="font-lora text-xs text-muted">Sunday: 10:00 AM – 5:00 PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gold/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-cinzel text-[10px] tracking-[3px] text-muted">© 2024 SMARTSALON. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="font-cinzel text-[9px] tracking-[2px] text-muted hover:text-gold transition-colors">PRIVACY</Link>
            <Link href="/terms" className="font-cinzel text-[9px] tracking-[2px] text-muted hover:text-gold transition-colors">TERMS</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
