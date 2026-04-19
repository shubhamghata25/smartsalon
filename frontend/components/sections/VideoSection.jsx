"use client";
import { Instagram, Play } from "lucide-react";

function getEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=0&rel=0`;
  // Instagram — can't embed directly, show as link card
  return null;
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
          {videos.map(video => {
            const embedUrl = getEmbedUrl(video.url);
            return (
              <div key={video.id} className="luxury-card rounded-sm overflow-hidden group">
                {embedUrl ? (
                  <div className="relative" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      loading="lazy"
                      title={video.title || "Salon video"}
                    />
                  </div>
                ) : (
                  /* Instagram / other — show as clickable thumbnail card */
                  <a href={video.url} target="_blank" rel="noreferrer"
                    className="block relative overflow-hidden">
                    {video.thumbnail_url ? (
                      <div className="relative h-52 overflow-hidden">
                        <img src={video.thumbnail_url} alt={video.title || "Video"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-forest-dark/50 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center group-hover:bg-gold/40 transition-all animate-glow-pulse">
                            <Play size={20} className="text-gold ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-52 flex flex-col items-center justify-center gap-3"
                        style={{ background: "linear-gradient(135deg, rgba(15,59,47,0.8), rgba(201,168,76,0.06))" }}>
                        <Instagram size={36} className="text-gold/60" />
                        <span className="font-cinzel text-[9px] tracking-[2px] text-cream/50 uppercase">Watch on Instagram</span>
                      </div>
                    )}
                  </a>
                )}
                {video.title && (
                  <div className="p-3">
                    <p className="font-lora text-sm text-cream/70 truncate">{video.title}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
