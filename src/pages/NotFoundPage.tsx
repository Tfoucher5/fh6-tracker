import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, RefreshCw } from "lucide-react";

const CONTACT_EMAIL = "theonicolas.foucher@gmail.com";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen bg-[#050810] text-white flex items-center justify-center p-4 overflow-hidden relative"
      style={{ fontFamily: "inherit" }}
    >
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            top: -120,
            left: -100,
            background: "radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 65%)",
            filter: "blur(80px)",
            animation: "fh-drift 22s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 560,
            height: 560,
            bottom: -160,
            right: -120,
            background: "radial-gradient(circle, rgba(251,146,60,0.14) 0%, transparent 65%)",
            filter: "blur(90px)",
            animation: "fh-drift 28s ease-in-out infinite alternate-reverse",
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* Card */}
      <article
        className="relative z-10 w-full max-w-xl rounded-[22px] border border-white/8 overflow-hidden"
        style={{
          background: "rgba(10, 15, 30, 0.76)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 64px rgba(0,0,0,0.5), 0 0 80px rgba(239,68,68,0.14)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 p-8 pb-0 flex-wrap">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-400"
            style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 8px #ef4444",
                display: "inline-block",
                animation: "fh-pulse 2s infinite",
              }}
              aria-hidden="true"
            />
            Page introuvable
          </div>

          <div
            className="font-heading font-black leading-none"
            style={{
              fontSize: "clamp(4rem, 12vw, 6.5rem)",
              letterSpacing: "-0.06em",
              background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "fh-glitch 6s infinite",
            }}
            aria-label="Erreur 404"
          >
            404
          </div>
        </header>

        {/* Illustration — piste de course qui flatline */}
        <div className="px-8 pt-4 pb-1 opacity-70" aria-hidden="true">
          <svg width="240" height="48" viewBox="0 0 240 48" fill="none">
            <polyline
              points="0,24 16,24 22,8 30,40 38,12 46,36 54,20 62,32 70,24 86,24 110,24"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.45"
            />
            <line x1="110" y1="24" x2="240" y2="24" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            <circle cx="110" cy="24" r="3" fill="#ef4444" />
            {/* Ligne de route en dessous */}
            <line x1="0" y1="38" x2="240" y2="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="10 8" />
          </svg>
        </div>

        {/* Texte */}
        <div className="px-8 pb-5">
          <h1 className="font-heading font-black text-3xl uppercase tracking-wide text-white mb-2 leading-tight">
            Route perdue dans le brouillard
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[44ch]">
            Cette page n'existe pas — ou elle a été éjectée du catalogue après une collision. Vérifie l'URL ou reviens sur la piste principale.
          </p>
        </div>

        {/* Console */}
        <div className="mx-8 mb-5 rounded-xl border border-white/7 overflow-hidden bg-black/30">
          <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/6 bg-white/[0.02]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" aria-hidden="true" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" aria-hidden="true" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="ml-1.5 font-mono text-[0.72rem] font-semibold text-slate-500">error.log</span>
          </div>
          <div className="px-4 py-3 font-mono text-[0.82rem] flex gap-3">
            <span className="text-red-500 font-bold shrink-0">$</span>
            <span className="text-slate-400">Route inconnue. La voiture a quitté la piste. 404 confirmé.</span>
          </div>
        </div>

        {/* Actions */}
        <footer className="px-8 pb-8 border-t border-white/5 pt-5 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: "linear-gradient(135deg, #ef4444, #f97316)",
              color: "#030712",
              boxShadow: "0 6px 20px rgba(239,68,68,0.28)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 10px 28px rgba(239,68,68,0.40)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px rgba(239,68,68,0.28)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            <Home size={15} />
            Retour à l'accueil
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-400 border border-white/8 bg-white/[0.04] hover:bg-white/[0.07] hover:text-white hover:border-white/14 transition-all"
          >
            <RefreshCw size={15} />
            Page précédente
          </button>
        </footer>

        {/* Contact */}
        <div className="px-8 pb-6 -mt-2">
          <p className="text-xs text-slate-600">
            Problème persistant ?{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-slate-500 hover:text-red-400 transition-colors underline underline-offset-2"
            >
              Contacter l'équipe
            </a>
          </p>
        </div>
      </article>

      <style>{`
        @keyframes fh-drift {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(24px, -18px) scale(1.06); }
        }
        @keyframes fh-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes fh-glitch {
          0%, 92%, 100% { text-shadow: none; transform: none; }
          93%  { transform: translate(-2px, 1px); filter: hue-rotate(20deg); }
          94%  { transform: translate(2px, -1px); filter: hue-rotate(-15deg); }
          95%  { transform: translate(-1px, 0); filter: none; }
          96%  { transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes fh-drift   { 0%, 100% { transform: none; } }
          @keyframes fh-pulse   { 0%, 100% { opacity: 1; } }
          @keyframes fh-glitch  { 0%, 100% { transform: none; filter: none; } }
        }
      `}</style>
    </div>
  );
}
