"use client";
/**
 * FILE: frontend/components/Navbar.jsx  [MODIFIED]
 * Change: salon name and logo now loaded from /api/settings (dynamic)
 */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { settingsAPI } from "@/lib/api";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({ salon_name: "SMARTSALON", logo_url: "" });
  const pathname = usePathname();

  useEffect(() => {
    const u = localStorage.getItem("ss_user");
    if (u) setUser(JSON.parse(u));

    // Load dynamic settings
    settingsAPI.get()
      .then(r => setSettings(r.data))
      .catch(() => {});

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
    setUser(null);
    window.location.href = "/";
  };

  const links = [
    { href: "/",         label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/booking",  label: "Book Now" },
    { href: "/courses",  label: "Courses" },
    { href: "/careers",  label: "Careers" },
    { href: "/contact",  label: "Contact" },
  ];

  const isActive = (href) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const displayName = settings.salon_name || "SMARTSALON";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-charcoal/98 shadow-lg shadow-black/30" : "bg-charcoal/90"} backdrop-blur-xl border-b border-gold/10`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[70px]">
        {/* Logo — dynamic */}
        <Link href="/" className="flex items-center gap-3 group">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={displayName}
              style={{ height: 36, width: "auto", objectFit: "contain" }}
            />
          ) : (
            <div className="flex flex-col leading-none">
              <span className="font-cinzel text-xl font-bold text-gold tracking-[5px] group-hover:text-gold-light transition-colors">
                {displayName.toUpperCase()}
              </span>
              <span className="font-cinzel text-[8px] tracking-[6px] text-muted uppercase">SALON</span>
            </div>
          )}
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-cinzel text-[11px] tracking-[2px] uppercase transition-all duration-200 hover:text-gold ${
                href === "/booking"
                  ? "btn-gold !py-2 !px-5 !text-[10px] hover:text-white"
                  : isActive(href)
                  ? "text-gold border-b border-gold pb-0.5"
                  : "text-cream/70"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-cinzel text-[10px] tracking-widest text-muted">{user.name}</span>
              {user.role === "admin" ? (
                <Link href="/admin" className="btn-outline !py-2 !px-4 !text-[9px] flex items-center gap-1">
                  <Shield size={12} /> Admin
                </Link>
              ) : (
                <Link href="/dashboard" className="btn-outline !py-2 !px-4 !text-[9px] flex items-center gap-1">
                  <LayoutDashboard size={12} /> Dashboard
                </Link>
              )}
              <button onClick={logout} className="text-muted hover:text-red-400 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-outline !py-2 !px-5 !text-[10px] flex items-center gap-2">
              <User size={13} /> Login
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="lg:hidden text-cream" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-charcoal border-t border-gold/10 px-6 py-6 flex flex-col gap-5">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`font-cinzel text-[12px] tracking-[3px] uppercase ${isActive(href) ? "text-gold" : "text-cream/70"}`}>
              {label}
            </Link>
          ))}
          <div className="pt-4 border-t border-gold/10">
            {user ? (
              <div className="flex flex-col gap-3">
                <span className="font-cinzel text-[10px] text-muted">{user.name}</span>
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)}
                  className="btn-outline !py-2 !px-4 !text-[10px] w-fit">
                  {user.role === "admin" ? "Admin Panel" : "My Dashboard"}
                </Link>
                <button onClick={logout} className="text-muted text-sm font-cinzel tracking-widest text-left">LOGOUT</button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}
                className="btn-gold !py-3 !px-6 !text-[11px] w-full text-center block">
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
