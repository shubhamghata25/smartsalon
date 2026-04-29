"use client";
/**
 * FILE: frontend/components/sections/VideoSection.jsx
 *
 * FIX #6: Instagram reels not playing.
 *
 * ROOT CAUSE: Instagram's /reel/{id}/embed iframe requires the Instagram
 * embed.js script to initialise and actually render the content. Without it
 * the iframe loads a blank or spinner page. Additionally, browser autoplay
 * policies block video without user interaction — the official blockquote +
 * instgrm.Embeds.process() approach is the only reliable cross-browser path.
 *
 * STRATEGY:
 *  1. For YouTube  → plain iframe (works fine, no change).
 *  2. For Instagram → use the official blockquote embed markup and load
 *     instagram embed.js once per page via a singleton script tag.
 *     On mobile/desktop this triggers Instagram's own player which handles
 *     autoplay, mute, and browser policy compliance correctly.
 *  3. Fallback card with "Open on Instagram" link when the script is
 *     blocked (e.g. ad-blockers) — detected via a load-timeout.
 */
import { useState, useEffect, useRef } from "react";
import { Instagram, Play, ExternalLink, Loader } from "lucide-react";

// ── Load Instagram embed.js exactly once ─────────────────────────────────────
let igScriptLoaded = false;
let igScriptLoading = false;
const igReadyCallbacks = [];

function loadInstagramScript(onReady) {
  if (igScriptLoaded) { onReady(); return; }
  igReadyCallbacks.push(onReady);
  if (igScriptLoading) return;
  igScriptLoading = true;

  const s = document.createElement("script");
  s.src = "https://www.instagram.com/embed.js";
  s.async = true;
  s.defer = true;
  s.onload = () => {
    igScriptLoaded = true;
    igReadyCallbacks.forEach(cb => cb());
    igReadyCallbacks.length = 0;
  };
  s.onerror = () => {
    // Script blocked — callbacks will trigger the fallback state
    igReadyCallbacks.forEach(cb => cb(true)); // pass error=true
    igReadyCallbacks.length = 0;
  };
  document.body.appendChild(s);
}

// ── URL parsers ───────────────────────────────────────────────────────────────
function parseYouTube(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
  return m ? m[1] : null;
}

function parseInstagram(url) {
  const m = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

// ── YouTube card ──────────────────────────────────────────────────────────────
function YouTubeCard({ videoId, title }) {
  return (
    <div className="luxury-card rounded-sm overflow-hidden">
      <div className="relative overflow-hidden" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={title || "YouTube video"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {title && (
        <div className="p-3">
          <p className="font-lora text-sm text-cream/70 truncate">{title}</p>
        </div>
      )}
    </div>
  );
}

// ── Instagram embed card ──────────────────────────────────────────────────────
function InstagramCard({ reelId, originalUrl, title }) {
  const containerRef = useRef(null);
  const [state, setState] = useState("loading"); // "loading" | "ready" | "failed"

  useEffect(() => {
    // Timeout fallback: if script doesn't run within 6s, show link card
    const timeout = setTimeout(() => {
      setState(s => s === "loading" ? "failed" : s);
    }, 6000);

    loadInstagramScript((err) => {
      clearTimeout(timeout);
      if (err) { setState("failed"); return; }
      setState("ready");
      // Tell Instagram's script to process any new blockquotes in the DOM
      if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      }
    });

    return () => clearTimeout(timeout);
  }, [reelId]);

  if (state === "failed") {
    return (
      <a
        href={originalUrl}
        target="_blank"
        rel="noreferrer"
        className="luxury-card rounded-sm overflow-hidden flex flex-col items-center justify-center gap-4 p-8 hover:border-gold/40 transition-all group"
        style={{ minHeight: 280 }}
      >
        <Instagram size={40} className="text-gold/50 group-hover:text-gold transition-colors" />
        <div className="text-center">
          <div className="font-cinzel text-[10px] tracking-[3px] text-cream/60 uppercase mb-1">
            {title || "Instagram Reel"}
          </div>
          <div className="font-lora text-xs text-cream/35">Watch on Instagram</div>
        </div>
        <div className="flex items-center gap-1.5 font-cinzel text-[9px] tracking-[2px] text-gold/50 group-hover:text-gold transition-colors uppercase">
          <ExternalLink size={12} /> Open Reel
        </div>
      </a>
    );
  }

  return (
    <div className="luxury-card rounded-sm overflow-hidden" ref={containerRef}>
      {state === "loading" && (
        <div
          className="flex items-center justify-center gap-2"
          style={{ minHeight: 280 }}
        >
          <Loader size={20} className="text-gold/50 animate-spin" />
          <span className="font-cinzel text-[9px] tracking-[2px] text-cream/35 uppercase">Loading reel…</span>
        </div>
      )}

      {/*
        Official Instagram blockquote embed.
        instgrm.Embeds.process() converts this into a full interactive player.
        The data-instgrm-version and permalink are required.
      */}
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={`https://www.instagram.com/reel/${reelId}/`}
        data-instgrm-version="14"
        style={{
          background: "transparent",
          border: 0,
          margin: 0,
          padding: 0,
          width: "100%",
          display: state === "loading" ? "none" : "block",
        }}
      />

      {title && state === "ready" && (
        <div className="px-4 pb-3 pt-1 flex items-center justify-between gap-2">
          <p className="font-lora text-sm text-cream/70 truncate flex-1">{title}</p>
          <a
            href={originalUrl}
            target="_blank"
            rel="noreferrer"
            className="font-cinzel text-[8px] tracking-[2px] text-gold/40 hover:text-gold uppercase flex items-center gap-1 transition-colors shrink-0"
          >
            <Instagram size={10} /> Open
          </a>
        </div>
      )}
    </div>
  );
}

// ── Generic fallback for unknown URLs ─────────────────────────────────────────
function GenericCard({ video }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer"
      className="luxury-card rounded-sm overflow-hidden group flex flex-col"
    >
      {video.thumbnail_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={video.thumbnail_url}
            alt={video.title || "Video"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.currentTarget.parentElement.style.display = "none"; }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(10,42,33,0.45)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.2)", border: "2px solid #C9A84C" }}
            >
              <Play size={20} className="text-gold ml-1" />
            </div>
          </div>
        </div>
      )}
      <div className="p-4 flex items-center gap-2">
        <ExternalLink size={14} className="text-gold/50 shrink-0" />
        <span className="font-lora text-sm text-cream/60 truncate">
          {video.title || "Watch Video"}
        </span>
      </div>
    </a>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function VideoSection({ videos = [] }) {
  if (!videos.length) return null;

  return (
    <section
      className="py-16 sm:py-20 px-4 sm:px-6"
      style={{ background: "rgba(15,59,47,0.3)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="section-label justify-center">
            <span className="gold-line" />
            <span>Follow Our Work</span>
            <span className="gold-line" />
          </div>
          <h2 className="font-playfair text-[clamp(24px,4vw,42px)] font-bold text-cream">
            <em className="text-gold">Instagram</em> Reels
          </h2>
          <p className="font-lora text-sm text-cream/50 mt-2">
            Follow us for daily transformations and styling inspiration
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map(video => {
            const ytId = parseYouTube(video.url);
            if (ytId) return <YouTubeCard key={video.id} videoId={ytId} title={video.title} />;

            const igId = parseInstagram(video.url);
            if (igId) return (
              <InstagramCard
                key={video.id}
                reelId={igId}
                originalUrl={video.url}
                title={video.title}
              />
            );

            return <GenericCard key={video.id} video={video} />;
          })}
        </div>
      </div>
    </section>
  );
}
