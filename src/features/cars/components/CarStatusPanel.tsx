import { Camera, Check, Star, X, Share2, ListPlus, ListMinus } from "lucide-react";
import type { UserCarDetail } from "../types";

type CarStatusPanelProps = {
  status: UserCarDetail;
  saving: boolean;
  onToggle: (field: "owned" | "photographed" | "favorite" | "wanted") => void;
  onShare?: () => void;
};

export function CarStatusPanel({ status, saving, onToggle, onShare }: CarStatusPanelProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="font-heading font-bold text-xl uppercase tracking-wide">Mon statut</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          disabled={saving}
          onClick={() => onToggle("owned")}
          className={`rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors ${
            status.owned ? "bg-red-600 hover:bg-red-500" : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {status.owned ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {status.owned ? "Possédée" : "Manquante"}
        </button>

        <button
          disabled={saving}
          onClick={() => onToggle("photographed")}
          className={`rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors ${
            status.photographed ? "bg-emerald-600 hover:bg-emerald-500" : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          <Camera className="w-5 h-5" />
          {status.photographed ? "Photo OK" : "À photographier"}
        </button>

        <button
          disabled={saving}
          onClick={() => onToggle("favorite")}
          className={`rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors ${
            status.favorite
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          <Star className={`w-5 h-5 ${status.favorite ? "fill-yellow-300" : ""}`} />
          Favorite
        </button>
      </div>

      {/* Wishlist + Share */}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={saving}
          onClick={() => onToggle("wanted")}
          className={`rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors ${
            status.wanted
              ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30"
              : "bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300"
          }`}
        >
          {status.wanted ? <ListMinus className="w-5 h-5" /> : <ListPlus className="w-5 h-5" />}
          {status.wanted ? "Sur ma wishlist" : "Ajouter à la wishlist"}
        </button>

        {onShare ? (
          <button
            onClick={onShare}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-colors text-slate-300"
          >
            <Share2 className="w-5 h-5" />
            Partager dans le feed
          </button>
        ) : (
          <div />
        )}
      </div>
    </section>
  );
}
