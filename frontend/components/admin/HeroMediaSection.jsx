"use client";
/**
 * FILE: frontend/components/admin/HeroMediaSection.jsx  [NEW]
 *
 * Drop into admin/page.jsx settings tab.
 * Allows admin to upload image or video as homepage background.
 * Calls POST /api/settings/hero-media with multipart form data.
 * Shows current media, allows removal.
 */
import { useState, useRef } from "react";
import { settingsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Upload, Trash2, Image, Film, Loader, CheckCircle } from "lucide-react";

export default function HeroMediaSection({ currentUrl, currentType, onSaved }) {
  const [file,       setFile]       = useState(null);
  const [type,       setType]       = useState("image"); // "image" | "video"
  const [preview,    setPreview]    = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [removing,   setRemoving]   = useState(false);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const isVideo = f.type.startsWith("video/");
    setType(isVideo ? "video" : "image");
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Select a file first");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await settingsAPI.uploadHeroMedia(fd, type);
      toast.success("Hero media updated!");
      setFile(null); setPreview(null);
      if (onSaved) onSaved(data);
    } catch (e) {
      toast.error(e.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await settingsAPI.clearHeroMedia();
      toast.success("Hero media removed — canvas animation restored");
      if (onSaved) onSaved(null);
    } catch (e) {
      toast.error("Failed to remove");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="glass-card p-5 rounded-sm">
      <div className="font-cinzel text-[10px] tracking-[3px] text-gold mb-4 uppercase">
        Homepage Hero Background
      </div>
      <p className="font-lora text-xs text-muted mb-4 leading-relaxed">
        Upload an image (JPG/PNG/WEBP) or video (MP4) to replace the animated canvas on the homepage.
        Leave empty to use the default animated background.
      </p>

      {/* Current media preview */}
      {currentUrl && !preview && (
        <div className="mb-4 relative rounded-sm overflow-hidden" style={{ maxHeight: 200 }}>
          {currentType === "video" ? (
            <video src={currentUrl} muted autoPlay loop playsInline
              className="w-full object-cover rounded-sm" style={{ maxHeight: 200 }} />
          ) : (
            <img src={currentUrl} alt="Current hero" className="w-full object-cover rounded-sm"
              style={{ maxHeight: 200 }}
              onError={e => { e.currentTarget.style.display="none"; }} />
          )}
          <div className="absolute top-2 right-2">
            <span className="font-cinzel text-[8px] tracking-[2px] bg-forest-dark/80 text-gold px-2 py-1 rounded-sm uppercase">
              Current {currentType}
            </span>
          </div>
        </div>
      )}

      {/* New file preview */}
      {preview && (
        <div className="mb-4 relative rounded-sm overflow-hidden" style={{ maxHeight: 200 }}>
          {type === "video" ? (
            <video src={preview} muted autoPlay loop playsInline
              className="w-full object-cover rounded-sm" style={{ maxHeight: 200 }} />
          ) : (
            <img src={preview} alt="Preview" className="w-full object-cover rounded-sm"
              style={{ maxHeight: 200 }} />
          )}
          <div className="absolute top-2 right-2">
            <span className="font-cinzel text-[8px] tracking-[2px] bg-green-900/80 text-green-400 px-2 py-1 rounded-sm uppercase">
              Preview — {type}
            </span>
          </div>
        </div>
      )}

      {/* Upload area */}
      <label
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gold/20 hover:border-gold/40 rounded-sm p-6 cursor-pointer transition-colors mb-4"
        style={{ background: "rgba(201,168,76,0.02)" }}
      >
        <div className="flex gap-3 text-gold/50">
          <Image size={22} />
          <Film size={22} />
        </div>
        <div className="text-center">
          <div className="font-cinzel text-[10px] tracking-[2px] text-cream/70">
            {file ? file.name : "Click to select image or video"}
          </div>
          <div className="font-lora text-xs text-muted mt-1">
            JPG · PNG · WEBP · MP4 · max 100 MB
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/mov,video/webm"
          onChange={handleFileChange}
        />
      </label>

      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-gold flex items-center gap-2 flex-1 justify-center"
        >
          {uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Uploading..." : "Save Hero Media"}
        </button>

        {(currentUrl || preview) && (
          <button
            onClick={handleRemove}
            disabled={removing}
            className="btn-outline flex items-center gap-2 px-4"
            style={{ borderColor: "rgba(198,40,40,0.4)", color: "#ef9a9a" }}
          >
            {removing ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
