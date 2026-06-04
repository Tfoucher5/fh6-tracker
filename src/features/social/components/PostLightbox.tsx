import { useEffect } from "react";
import { X, ZoomIn } from "lucide-react";

type PostLightboxProps = {
  src: string;
  alt?: string;
  onClose: () => void;
};

export function PostLightbox({ src, alt = "Photo", onClose }: PostLightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
      >
        <X className="w-8 h-8" />
      </button>

      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90dvh] object-contain rounded-xl shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

type LightboxTriggerProps = {
  src: string;
  alt?: string;
  className?: string;
  children: React.ReactNode;
  onOpen: (src: string) => void;
};

export function LightboxTrigger({ src, className, children, onOpen }: LightboxTriggerProps) {
  return (
    <div
      className={`relative group/lb cursor-zoom-in ${className ?? ""}`}
      onClick={() => onOpen(src)}
    >
      {children}
      <div className="absolute inset-0 bg-black/0 group-hover/lb:bg-black/20 transition-colors flex items-center justify-center">
        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/lb:opacity-80 transition-opacity" />
      </div>
    </div>
  );
}
