import { Camera, Check, Star, X } from "lucide-react";
import type { UserCarDetail } from "../types";

type CarStatusPanelProps = {
  status: UserCarDetail;
  saving: boolean;
  onToggle: (field: "owned" | "photographed" | "favorite") => void;
};

export function CarStatusPanel({
  status,
  saving,
  onToggle,
}: CarStatusPanelProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="text-xl font-bold">Mon statut</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          disabled={saving}
          onClick={() => onToggle("owned")}
          className={`rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 ${
            status.owned
              ? "bg-red-600 hover:bg-red-500"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {status.owned ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          {status.owned ? "Possédée" : "Manquante"}
        </button>

        <button
          disabled={saving}
          onClick={() => onToggle("photographed")}
          className={`rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 ${
            status.photographed
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          <Camera className="w-5 h-5" />
          {status.photographed ? "Photo OK" : "À photographier"}
        </button>

        <button
          disabled={saving}
          onClick={() => onToggle("favorite")}
          className={`rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 ${
            status.favorite
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          <Star
            className={`w-5 h-5 ${status.favorite ? "fill-yellow-300" : ""}`}
          />
          Favorite
        </button>
      </div>
    </section>
  );
}