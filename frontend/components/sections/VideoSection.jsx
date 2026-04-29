"use client";
/**
 * FILE: frontend/components/sections/VideoSection.jsx  [v4]
 * - Correctly embeds Instagram reels via /reel/{id}/embed
 * - YouTube still embedded directly
 * - Fallback card if embed fails (blocked by browser)
 */
import { useState } from "react";
import { Instagram, Play, ExternalLink } from "lucide-react";

function getEmbedInfo(url) {
  if (!url) return null;

  // YouTube
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
  if (yt) return { type: "youtube", embed: `https://www.youtube.com/embed/${yt[1]}?rel=0` };

  // Instagram reel — extract reel ID
  // Handles: https://www.instagram.com/reel/ABC123/
  //          https://www.instagram.com/p/ABC123/
  const ig = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (ig) return { type: "instagram", embed: `https://www.instagram.com/reel/${ig[1]}/embed`, reelId: ig[1], original: url };

  return { type: "other", embed: null, original: url };
}

function VideoCard({ video }) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const info = getEmbedInfo(video.url);

  const canEmbed = info && (info.type === "youtube" || info.type === "instagram") && !embedFailed;

  return (
    <div className="luxury-card rounded-sm overflow-hidden group flex flex-col">
      {canEmbed ? (
        <div
          className="relative overflow-hidden"
          style={{ paddingTop: info.type === "instagram" ? "120%" : "56.25%" }}
        >
          <iframe
            src={info.embed}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            loading="lazy"
            scrolling="no"
            frameBorder="0"
            title={video.title || "Salon video"}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            onError={() => setEmbedFailed(true)}
          />
        </div>
      ) : (
        /* Fallback — thumbnail or placeholder */
        <a href={video.url} target="_blank" rel="noreferrer" className="block relative overflow-hidden">
          {video.thumbnail_url ? (
            <div className="relative h-52 overflow-hidden">
              <img
                src={video.thumbnail_url}
                alt={video.title || "Video"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(10,42,33,0.5)" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                  style={{ background: "rgba(201,168,76,0.2)", border: "2px solid #C9A84C" }}>
                  <Play size={20} className="text-gold ml-1" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg, rgba(15,59,47,0.8), rgba(201,168,76,0.06))" }}>
              <Instagram size={36} className="text-gold/60" />
              <span className="font-cinzel text-[9px] tracking-[2px] text-cream/50 uppercase">
                {info?.type === "instagram" ? "Watch on Instagram" : "Watch Video"}
              </span>
              <ExternalLink size={14} className="text-gold/40" />
            </div>
          )}
        </a>
      )}

      {/* Footer */}
      <div className="p-3 flex items-center justify-between gap-2">
        {video.title ? (
          <p className="font-lora text-sm text-cream/70 truncate flex-1">{video.title}</p>
        ) : <span />}
        {info?.type === "instagram" && (
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 font-cinzel text-[8px] tracking-[2px] text-gold/50 hover:text-gold uppercase flex items-center gap-1 transition-colors"
          >
            <Instagram size={10} /> Open
          </a>
        )}
      </div>
    </div>
  );
}

export default function VideoSection({ videos = [] }) {
  if (!videos.length) return null;

  return (
    <section className="py-16 sm:py-20 container-pad" style={{ background: "rgba(15,59,47,0.3)" }}>
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
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
}
