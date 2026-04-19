"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { servicesAPI, offersAPI } from "@/lib/api";

export default function HomePage() {
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const [services, setServices] = useState([]);
  const [offers, setOffers] = useState([]);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    servicesAPI.list().then(r => setServices(r.data.slice(0, 6))).catch(() => {});
    offersAPI.list().then(r => setOffers(r.data)).catch(() => {});
  }, []);

  /* ── HERO CANVAS ── */
  useEffect(() => {
    const canvas = heroRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId, t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || 1200;
      canvas.height = canvas.offsetHeight || 620;
    };
    resize();
    window.addEventListener("resize", resize);

    const strands = Array.from({ length: 90 }, () => ({
      x: Math.random() * 1200,
      y: Math.random() * 700,
      len: 60 + Math.random() * 130,
      speed: 0.25 + Math.random() * 0.45,
      opacity: 0.025 + Math.random() * 0.055,
      color: Math.random() > 0.65 ? "#C9A84C" : "#5C3D2E",
      width: 0.4 + Math.random() * 1.6,
      curve: (Math.random() - 0.5) * 32,
    }));

    const drawScissors = (x, y, size, angle, alpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#C9A84C";
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-size * 0.7, -size);
      ctx.moveTo(0, 0); ctx.lineTo(size * 0.7, -size);
      ctx.moveTo(0, 0); ctx.lineTo(-size * 0.4, size * 0.8);
      ctx.moveTo(0, 0); ctx.lineTo(size * 0.4, size * 0.8);
      ctx.arc(-size * 0.55, -size * 0.7, size * 0.12, 0, Math.PI * 2);
      ctx.arc(size * 0.55, -size * 0.7, size * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const spPositions = [
      { xr: 0.15, yr: 0.25, size: 16, sp: 0.003, alpha: 0.12 },
      { xr: 0.75, yr: 0.15, size: 24, sp: 0.002, alpha: 0.08 },
      { xr: 0.85, yr: 0.7,  size: 11, sp: 0.004, alpha: 0.09 },
      { xr: 0.12, yr: 0.8,  size: 20, sp: 0.0025, alpha: 0.06 },
    ];

    const frame = () => {
      t++;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, W, H);

      const g1 = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.55);
      g1.addColorStop(0, "rgba(44,24,16,.38)");
      g1.addColorStop(1, "rgba(8,8,8,0)");
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

      const g2 = ctx.createRadialGradient(W * 0.8, H * 0.6, 0, W * 0.8, H * 0.6, W * 0.4);
      g2.addColorStop(0, "rgba(201,168,76,.04)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

      strands.forEach(s => {
        s.y += s.speed;
        if (s.y > H + s.len) s.y = -s.len;
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo(s.x + s.curve, s.y + s.len / 2, s.x - s.curve * 0.5, s.y + s.len);
        ctx.stroke();
        ctx.restore();
      });

      spPositions.forEach((sp, i) => {
        const angle = Math.sin(t * sp.sp + i) * 0.3;
        drawScissors(sp.xr * W, sp.yr * H, sp.size, angle, sp.alpha);
      });

      for (let i = 0; i < 4; i++) {
        const r = 40 + i * 18 + Math.sin(t * 0.02 + i) * 6;
        ctx.save();
        ctx.globalAlpha = 0.05 - i * 0.01;
        ctx.strokeStyle = "#C9A84C";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(W * 0.72, H * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(frame);
    };
    frame();
    setTimeout(() => setHeroLoaded(true), 300);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  /* ── ABOUT CANVAS ── */
  useEffect(() => {
    const canvas = aboutRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId, at = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || 500;
      canvas.height = canvas.offsetHeight || 500;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: 36 }, () => ({
      x: Math.random() * 500, y: Math.random() * 500,
      r: 0.6 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.018,
    }));

    const frame = () => {
      at += 0.01;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#060606";
      ctx.fillRect(0, 0, W, H);

      const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.6);
      g.addColorStop(0, "rgba(201,168,76,.07)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      dots.forEach(d => {
        const x = (d.x + Math.sin(at * d.speed + d.phase) * 15) % W;
        const y = (d.y + Math.cos(at * d.speed + d.phase) * 10) % H;
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(at * d.speed * 2 + d.phase) * 0.18;
        ctx.fillStyle = "#C9A84C";
        ctx.beginPath();
        ctx.arc(x, y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.globalAlpha = 0.055 - i * 0.012;
        ctx.strokeStyle = "#C9A84C";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(W/2, H/2, 48 + i * 40 + Math.sin(at + i * 0.7) * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(W/2, H/2);
      ctx.rotate(at * 0.18);
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = "#C9A84C";
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      const s = 32;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-s * 0.7, -s);
      ctx.moveTo(0, 0); ctx.lineTo(s * 0.7, -s);
      ctx.moveTo(0, 0); ctx.lineTo(-s * 0.4, s * 0.8);
      ctx.moveTo(0, 0); ctx.lineTo(s * 0.4, s * 0.8);
      ctx.arc(-s * 0.55, -s * 0.7, s * 0.12, 0, Math.PI * 2);
      ctx.arc(s * 0.55, -s * 0.7, s * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.font = `bold 64px 'Courier New',monospace`;
      ctx.fillStyle = "#C9A84C";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SS", W/2, H/2 + 3);
      ctx.restore();

      animId = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  /* ── COUNTER ANIMATION ── */
  useEffect(() => {
    const countTo = (id, target, suffix, delay) => {
      setTimeout(() => {
        let cur = 0;
        const el = document.getElementById(id);
        if (!el) return;
        const inc = Math.ceil(target / 60);
        const t = setInterval(() => {
          cur = Math.min(cur + inc, target);
          el.textContent = cur.toLocaleString() + suffix;
          if (cur >= target) clearInterval(t);
        }, 22);
      }, delay);
    };
    setTimeout(() => {
      countTo("cnt1", 5000, "+", 0);
      countTo("cnt2", 15, "+", 300);
      countTo("cnt3", 8, "+", 600);
    }, 600);
  }, []);

  /* ── CYCLING WORDS ── */
  useEffect(() => {
    const words = ["Meets Craft", "Defines You", "Tells Your Story", "Meets Craft"];
    let wi = 0;
    const el = document.getElementById("cycleWord");
    if (!el) return;
    const interval = setInterval(() => {
      el.style.transition = "opacity .35s, transform .35s";
      el.style.opacity = "0";
      el.style.transform = "translateY(-14px)";
      setTimeout(() => {
        wi = (wi + 1) % words.length;
        el.textContent = words[wi];
        el.style.transform = "translateY(14px)";
        setTimeout(() => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; }, 40);
      }, 360);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  /* ── PARTICLES ── */
  useEffect(() => {
    const container = document.getElementById("heroParticles");
    if (!container) return;
    const spawn = () => {
      const p = document.createElement("div");
      p.style.cssText = `position:absolute;width:2px;height:2px;background:#C9A84C;border-radius:50%;left:${Math.random()*100}%;bottom:0;opacity:0;animation:particleDrift ${3+Math.random()*4}s ease-out forwards`;
      container.appendChild(p);
      setTimeout(() => p.remove(), 7500);
    };
    const iv = setInterval(spawn, 900);
    return () => clearInterval(iv);
  }, []);

  const TESTIMONIALS = [
    { name: "Priya Sharma",  role: "Regular Customer",  av: "PS", text: "SmartSalon transformed my look completely. The stylists are true artists — they listened, understood, and delivered far beyond my expectations." },
    { name: "Rohan Mehta",   role: "Monthly Member",    av: "RM", text: "Best beard sculpting in the city. The hot towel treatment is worth every rupee. I will never go anywhere else for my grooming." },
    { name: "Ananya Iyer",   role: "Bridal Customer",   av: "AI", text: "My bridal package was absolutely flawless. Every detail was handled perfectly. I cried happy tears when I saw myself in the mirror." },
  ];

  const SERVICES_FALLBACK = [
    { id: "1", icon: "✂️", name: "Signature Haircut",  price: 599,  duration: 45,  description: "Precision cut tailored to your face shape." },
    { id: "2", icon: "🪒", name: "Beard Sculpting",    price: 399,  duration: 30,  description: "Expert shaping and hot-towel ritual finish." },
    { id: "3", icon: "🎨", name: "Hair Coloring",      price: 1499, duration: 90,  description: "Full color, highlights, balayage or ombré." },
    { id: "4", icon: "💆", name: "Luxury Facial",      price: 999,  duration: 60,  description: "Deep cleanse and signature hydration ritual." },
    { id: "5", icon: "🌿", name: "Hair Spa",           price: 799,  duration: 60,  description: "Scalp massage and deep conditioning." },
    { id: "6", icon: "👑", name: "Bridal Package",     price: 4999, duration: 180, description: "Head-to-toe prep for your perfect day." },
  ];

  const displayServices = services.length > 0 ? services : SERVICES_FALLBACK;

  const TICKER_ITEMS = ["Signature Haircut","Beard Sculpting","Hair Coloring","Luxury Facial","Hair Spa","Bridal Package","Book Online · Free","4.9 Star Rating"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Cinzel:wght@400;600;700&family=Lora:ital,wght@0,400;1,400&display=swap');
        @keyframes particleDrift{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:.6}90%{opacity:.25}100%{transform:translateY(-130px) translateX(18px);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lineGrow{from{width:0}to{width:48px}}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimmerPulse{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes pulsing{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.4)}70%{box-shadow:0 0 0 12px rgba(201,168,76,0)}}
        .hero-eyebrow-line{animation:lineGrow .7s .8s forwards;width:0}
        .hero-anim-1{animation:fadeUp .8s .4s both}
        .hero-anim-2{animation:fadeUp .8s .6s both}
        .hero-anim-3{animation:fadeUp .8s .8s both}
        .hero-anim-4{animation:fadeUp .8s 1s both}
        .svc-card-hover:hover{background:rgba(255,255,255,.035)!important;border-color:rgba(201,168,76,.28)!important;transform:translateY(-3px)}
        .svc-card-hover::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);transform:scaleX(0);transition:transform .4s}
        .svc-card-hover:hover::after{transform:scaleX(1)}
        .testi-card-hover:hover{border-color:rgba(201,168,76,.3)!important}
        .play-btn-pulse{animation:pulsing 2s infinite}
        .scroll-shimmer{animation:shimmerPulse 1.6s infinite}
      `}</style>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section style={{ position:"relative", height:"100vh", minHeight:580, maxHeight:760, overflow:"hidden", background:"#080808" }}>
        <canvas ref={heroRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", display:"block" }} />

        {/* Overlay */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(0,0,0,.72) 0%,rgba(20,10,5,.5) 50%,rgba(0,0,0,.62) 100%)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.025) 3px,rgba(0,0,0,.025) 4px)", pointerEvents:"none" }} />

        {/* Particles */}
        <div id="heroParticles" style={{ position:"absolute", inset:0, pointerEvents:"none" }} />

        {/* Content */}
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 5%", paddingTop:70 }}>
          {/* Eyebrow */}
          <div className="hero-anim-1" style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <span className="hero-eyebrow-line" style={{ height:1, background:"#C9A84C", display:"inline-block" }} />
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:4, color:"#C9A84C", textTransform:"uppercase" }}>Premium Unisex Salon · Mumbai</span>
          </div>

          {/* H1 */}
          <h1 className="hero-anim-2" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(40px,6vw,78px)", fontWeight:700, lineHeight:1.05, marginBottom:12, maxWidth:680 }}>
            <span style={{ color:"#F5F0E8" }}>Where Style</span><br />
            <span id="cycleWord" style={{ color:"#C9A84C", fontStyle:"italic", display:"inline-block", minWidth:240, transition:"opacity .35s, transform .35s" }}>Meets Craft</span>
          </h1>

          <p className="hero-anim-3" style={{ fontFamily:"'Lora',serif", fontSize:15, color:"rgba(245,240,232,.68)", maxWidth:460, lineHeight:1.75, marginBottom:30 }}>
            A sanctuary of refinement where every cut, color, and ritual is a masterpiece — crafted by artists who live for transformation.
          </p>

          {/* CTAs */}
          <div className="hero-anim-4" style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
            <Link href="/booking" style={{
              background:"linear-gradient(135deg,#C9A84C,#8B4513)", color:"#fff", border:"none",
              padding:"14px 32px", fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:"2.5px",
              textTransform:"uppercase", textDecoration:"none", borderRadius:2,
              display:"flex", alignItems:"center", gap:8, transition:"all .3s",
            }}>
              Book Appointment
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link href="/services" style={{
              background:"transparent", color:"rgba(245,240,232,.8)",
              border:"1px solid rgba(245,240,232,.3)", padding:"13px 28px",
              fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"2px",
              textTransform:"uppercase", textDecoration:"none", borderRadius:2, transition:"all .3s",
            }}>
              Explore Services
            </Link>
            <div className="play-btn-pulse" style={{
              width:48, height:48, borderRadius:"50%", border:"1px solid rgba(201,168,76,.5)",
              background:"rgba(201,168,76,.1)", display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer", flexShrink:0,
            }}>
              <div style={{ width:0, height:0, borderStyle:"solid", borderWidth:"7px 0 7px 14px", borderColor:"transparent transparent transparent #C9A84C", marginLeft:3 }} />
            </div>
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:"2px", color:"rgba(245,240,232,.3)", textTransform:"uppercase" }}>Watch Our Story</span>
          </div>
        </div>

        {/* Side stats */}
        <div style={{ position:"absolute", right:"4%", top:"50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", gap:2, animation:"fadeUp .8s 1.2s both" }}>
          {[{ id:"cnt1", val:"0", lbl:"Happy Clients" }, { id:"cnt2", val:"0", lbl:"Expert Stylists" }, { id:"cnt3", val:"0", lbl:"Years Running" }].map(s => (
            <div key={s.id} style={{ textAlign:"right", padding:"14px 18px", borderRight:"2px solid rgba(201,168,76,.28)" }}>
              <div id={s.id} style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"#C9A84C" }}>{s.val}</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:8, letterSpacing:"2px", color:"rgba(245,240,232,.35)", textTransform:"uppercase" }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="scroll-shimmer" style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{ width:1, height:32, background:"linear-gradient(180deg,rgba(201,168,76,.5),transparent)" }} />
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:8, letterSpacing:"3px", color:"rgba(245,240,232,.28)", textTransform:"uppercase" }}>Scroll</span>
        </div>
      </section>

      {/* ─── TICKER ─────────────────────────────────────────────── */}
      <div style={{ background:"#0d0d0d", borderTop:"1px solid rgba(201,168,76,.12)", borderBottom:"1px solid rgba(201,168,76,.12)", padding:"11px 0", overflow:"hidden" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"tickerScroll 24s linear infinite" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"3px", textTransform:"uppercase", color:"rgba(245,240,232,.32)", padding:"0 28px" }}>
              {item}
              {i % 1 === 0 && <span style={{ color:"rgba(201,168,76,.45)", marginLeft:28 }}>✦</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ─── SERVICES ─────────────────────────────────────────────── */}
      <section style={{ padding:"72px 5%", background:"#0d0d0d" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"4px", color:"#C9A84C", textTransform:"uppercase" }}>What We Offer</span>
            <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,4vw,48px)", fontWeight:700, color:"#F5F0E8" }}>
            Our <em style={{ color:"#C9A84C", fontStyle:"italic" }}>Services</em>
          </h2>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"rgba(201,168,76,.07)" }}>
          {displayServices.map((s, i) => (
            <div key={s.id} className="svc-card-hover" style={{
              background: i === 5 ? "linear-gradient(135deg,rgba(201,168,76,.06),rgba(139,69,19,.08))" : "#0d0d0d",
              padding:"28px 24px", cursor:"pointer", position:"relative",
              overflow:"hidden", transition:"all .3s", border:"1px solid transparent",
            }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:"3px", color:"rgba(201,168,76,.35)", marginBottom:14 }}>
                0{i + 1}
              </div>
              <div style={{ fontSize:32, marginBottom:12 }}>{s.icon}</div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"#F5F0E8", marginBottom:6 }}>{s.name}</h3>
              <p style={{ fontFamily:"'Lora',serif", fontSize:12, color:"rgba(245,240,232,.48)", lineHeight:1.6, marginBottom:14 }}>{s.description}</p>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#C9A84C" }}>₹{s.price}</span>
                <span style={{ fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:"2px", color:"rgba(245,240,232,.3)", textTransform:"uppercase" }}>{s.duration} min</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:36 }}>
          <Link href="/services" style={{
            background:"transparent", color:"#C9A84C", border:"1px solid rgba(201,168,76,.5)",
            padding:"12px 36px", fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"2.5px",
            textTransform:"uppercase", textDecoration:"none", borderRadius:2, transition:"all .3s",
            display:"inline-block",
          }}>View All Services</Link>
        </div>
      </section>

      {/* ─── MARQUEE ─────────────────────────────────────────────── */}
      <div style={{ padding:"28px 0", overflow:"hidden", background:"#080808", borderTop:"1px solid rgba(201,168,76,.07)", borderBottom:"1px solid rgba(201,168,76,.07)" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"tickerScroll 30s linear infinite" }}>
          {["Expert Stylists","·","Premium Products","·","On-Time Service","·","5,000+ Happy Clients","·","Book Online Free","·","4.9 Star Rating","·","8 Years of Excellence","·",
            "Expert Stylists","·","Premium Products","·","On-Time Service","·","5,000+ Happy Clients","·","Book Online Free","·","4.9 Star Rating","·","8 Years of Excellence","·",
          ].map((item, i) => (
            <span key={i} style={{ fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:"3px", textTransform:"uppercase", color: item === "·" ? "rgba(201,168,76,.5)" : i % 4 === 0 ? "rgba(201,168,76,.65)" : "rgba(245,240,232,.2)", padding:"0 20px" }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ─── ABOUT ─────────────────────────────────────────────── */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"#0d0d0d" }}>
        <div style={{ position:"relative", background:"#060606", minHeight:420 }}>
          <canvas ref={aboutRef} style={{ width:"100%", height:"100%", display:"block", position:"absolute", inset:0 }} />
        </div>
        <div style={{ padding:"56px 48px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"4px", color:"#C9A84C", textTransform:"uppercase" }}>Our Philosophy</span>
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, color:"#F5F0E8", marginBottom:12 }}>
            Craft Over <em style={{ color:"#C9A84C" }}>Convention</em>
          </h2>
          <p style={{ fontFamily:"'Lora',serif", fontSize:13, color:"rgba(245,240,232,.55)", lineHeight:1.8, marginBottom:20 }}>
            At SmartSalon, we believe a great haircut is more than scissors and skill — it is about understanding who you are and elevating it.
          </p>
          <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:14 }}>
            {[
              "Every stylist trained at premier academies with 3+ years of hands-on mastery",
              "Only dermatologically-tested luxury products — zero compromise",
              "Real-time online booking with instant confirmation emails",
              "Private consultation before every appointment — always free",
            ].map(item => (
              <li key={item} style={{ display:"flex", alignItems:"flex-start", gap:12, fontFamily:"'Lora',serif", fontSize:13, color:"rgba(245,240,232,.62)", lineHeight:1.55 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#C9A84C", flexShrink:0, marginTop:5 }} />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/contact" style={{
            marginTop:28, background:"linear-gradient(135deg,#C9A84C,#8B4513)", color:"#fff",
            padding:"12px 28px", fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"2.5px",
            textTransform:"uppercase", textDecoration:"none", borderRadius:2, width:"fit-content",
            display:"inline-block", transition:"all .3s",
          }}>Our Story →</Link>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────── */}
      <section style={{ padding:"72px 5%", background:"#080808" }}>
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"4px", color:"#C9A84C", textTransform:"uppercase" }}>Client Stories</span>
            <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,4vw,44px)", fontWeight:700, color:"#F5F0E8" }}>
            What Our Clients <em style={{ color:"#C9A84C" }}>Say</em>
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="testi-card-hover" style={{
              background:"#0f0f0f", border:"1px solid rgba(201,168,76,.1)",
              padding:28, borderRadius:2, transition:"border-color .3s",
            }}>
              <div style={{ color:"#C9A84C", fontSize:13, letterSpacing:3, marginBottom:14 }}>★★★★★</div>
              <p style={{ fontFamily:"'Lora',serif", fontSize:13, color:"rgba(245,240,232,.78)", lineHeight:1.75, fontStyle:"italic", marginBottom:20 }}>
                "{t.text}"
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background:"linear-gradient(135deg,#C9A84C,#8B4513)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'Cinzel',serif", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0,
                }}>{t.av}</div>
                <div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"1px", color:"#F5F0E8" }}>{t.name}</div>
                  <div style={{ fontFamily:"'Lora',serif", fontSize:11, color:"rgba(245,240,232,.35)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── OFFERS (admin-controlled, only shown if offers exist) ─── */}
      {offers.length > 0 && (
        <section style={{ padding:"64px 5%", background:"#0a0a0a" }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:14, marginBottom:12 }}>
              <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"4px", color:"#C9A84C", textTransform:"uppercase" }}>Special Offers</span>
              <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,4vw,42px)", fontWeight:700, color:"#F5F0E8" }}>
              Exclusive <em style={{ color:"#C9A84C" }}>Deals</em>
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
            {offers.map(offer => (
              <div key={offer.id} style={{
                background:"linear-gradient(135deg,rgba(44,24,16,0.6),rgba(201,168,76,0.06))",
                border:"1px solid rgba(201,168,76,0.2)", borderRadius:4, overflow:"hidden",
                transition:"transform 0.3s, border-color 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor="rgba(201,168,76,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor="rgba(201,168,76,0.2)"; }}
              >
                {offer.image_url && (
                  <div style={{ height:140, overflow:"hidden" }}>
                    <img src={offer.image_url} alt={offer.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                )}
                <div style={{ padding:"20px 20px 22px" }}>
                  {offer.discount && (
                    <div style={{ display:"inline-block", background:"linear-gradient(135deg,#C9A84C,#8B4513)", color:"#fff", padding:"3px 10px", borderRadius:2, fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:2, marginBottom:10, fontWeight:700 }}>
                      {offer.discount}
                    </div>
                  )}
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"#F5F0E8", marginBottom:8, fontWeight:700 }}>{offer.title}</h3>
                  {offer.description && (
                    <p style={{ fontFamily:"'Lora',serif", fontSize:12, color:"rgba(245,240,232,0.6)", lineHeight:1.65, marginBottom:14 }}>{offer.description}</p>
                  )}
                  <Link href="/booking" style={{
                    display:"inline-block", background:"transparent", color:"#C9A84C",
                    border:"1px solid rgba(201,168,76,0.5)", padding:"8px 20px",
                    fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:"2px",
                    textTransform:"uppercase", textDecoration:"none", borderRadius:2,
                  }}>
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section style={{ padding:"80px 5%", textAlign:"center", background:"#0d0d0d", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center,rgba(201,168,76,.07) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:14, marginBottom:14 }}>
            <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"4px", color:"#C9A84C", textTransform:"uppercase" }}>Ready For A Change?</span>
            <span style={{ display:"inline-block", width:32, height:1, background:"#C9A84C" }} />
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(30px,5vw,56px)", fontWeight:700, color:"#F5F0E8", marginBottom:12 }}>
            Book Your <em style={{ color:"#C9A84C" }}>Appointment</em>
          </h2>
          <p style={{ fontFamily:"'Lora',serif", fontSize:14, color:"rgba(245,240,232,.5)", marginBottom:36, maxWidth:420, margin:"0 auto 36px" }}>
            Reserve your slot and step into a world of expert grooming and personal style.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", marginBottom:48 }}>
            <Link href="/booking" style={{
              background:"linear-gradient(135deg,#C9A84C,#8B4513)", color:"#fff",
              padding:"16px 44px", fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:"2.5px",
              textTransform:"uppercase", textDecoration:"none", borderRadius:2,
              display:"inline-flex", alignItems:"center", gap:8,
            }}>
              Schedule Now →
            </Link>
            <a href="tel:+919876543210" style={{
              background:"transparent", color:"rgba(245,240,232,.75)",
              border:"1px solid rgba(245,240,232,.25)", padding:"15px 36px",
              fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"2px",
              textTransform:"uppercase", textDecoration:"none", borderRadius:2,
            }}>
              Call: +91 98765 43210
            </a>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:48, flexWrap:"wrap" }}>
            {[["5,000+","Happy Clients"],["4.9★","Average Rating"],["8+","Years of Excellence"]].map(([v,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700, color:"#C9A84C" }}>{v}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:"2px", color:"rgba(245,240,232,.28)", textTransform:"uppercase", marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
