import { Camera, Check, Star, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { CarRow, UserCarRow } from "../types";
import { CarImage } from "./CarImage";
import { ClassBadge } from "../../../components/ClassBadge";

type ToggleField = "owned" | "photographed" | "favorite";

type CatalogueCardProps = {
  car: CarRow;
  status: UserCarRow;
  saving: boolean;
  toggleStatus: (carId: string, field: ToggleField) => void;
};

export function CatalogueCard({ car, status, saving, toggleStatus }: CatalogueCardProps) {
  const title = `${car.year ?? "N/A"} ${car.make} ${car.model}`;

  return (
    <article className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-colors group">
      <CarImage imageUrl={car.image_url} alt={title} />

      <div className="p-4 space-y-3">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-mono">
              {car.year ?? "N/A"} · {car.make}
            </p>
            <Link
              to={`/cars/${car.id}`}
              className="font-heading font-bold text-xl leading-tight hover:text-red-400 transition-colors block truncate"
            >
              {car.model}
            </Link>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {car.car_class && (
              <ClassBadge carClass={car.car_class} pi={car.pi} />
            )}
            {status.favorite && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 space-y-0.5">
          {car.car_type && <p>{car.car_type}</p>}
          {car.country && <p>{car.country}</p>}
          {car.availability && <p>Source : {car.availability}</p>}
          {car.dlc && <p>DLC : {car.dlc}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={saving}
            onClick={() => toggleStatus(car.id, "owned")}
            className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
              status.owned
                ? "bg-red-600/90 hover:bg-red-500 text-white"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-400"
            }`}
          >
            {status.owned ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            {status.owned ? "Possédée" : "Manquante"}
          </button>

          <button
            disabled={saving}
            onClick={() => toggleStatus(car.id, "photographed")}
            className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
              status.photographed
                ? "bg-emerald-600/90 hover:bg-emerald-500 text-white"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-400"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {status.photographed ? "Photo OK" : "À photographier"}
          </button>
        </div>

        <button
          disabled={saving}
          onClick={() => toggleStatus(car.id, "favorite")}
          className={`w-full rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
            status.favorite
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-400"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${status.favorite ? "fill-amber-300" : ""}`} />
          {status.favorite ? "Favorite" : "Ajouter aux favorites"}
        </button>
      </div>
    </article>
  );
}
