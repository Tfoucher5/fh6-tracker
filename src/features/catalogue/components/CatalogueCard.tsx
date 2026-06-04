import { Camera, Check, Star, X } from "lucide-react";
import type { CarRow, UserCarRow } from "../types";
import { CarImage } from "./CarImage";
import { Link } from "react-router-dom";

type ToggleField = "owned" | "photographed" | "favorite";

type CatalogueCardProps = {
  car: CarRow;
  status: UserCarRow;
  saving: boolean;
  toggleStatus: (carId: string, field: ToggleField) => void;
};

export function CatalogueCard({
  car,
  status,
  saving,
  toggleStatus,
}: CatalogueCardProps) {
  const title = `${car.year ?? "N/A"} ${car.make} ${car.model}`;

  return (
    <article className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-colors">
      <CarImage imageUrl={car.image_url} alt={title} />

      <div className="p-4 space-y-4">
        <div className="flex justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">
              {car.year ?? "N/A"} · {car.make}
            </p>

            <Link
              to={`/cars/${car.id}`}
              className="font-bold text-xl leading-tight hover:text-red-300 transition-colors block"
            >
              {car.model}
            </Link>
          </div>

          <div className="flex flex-col items-end gap-2">
            {car.car_class && (
              <span className="rounded-full bg-red-500/15 border border-red-500/20 text-red-300 px-3 py-1 text-sm font-semibold">
                {car.car_class}
                {car.pi ? ` ${car.pi}` : ""}
              </span>
            )}

            {status.favorite && (
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            )}
          </div>
        </div>

        <div className="text-sm text-slate-400 space-y-1">
          <p>{car.car_type ?? "Type inconnu"}</p>
          <p>{car.country ?? "Pays inconnu"}</p>
          {car.availability && <p>Source : {car.availability}</p>}
          {car.dlc && <p>DLC : {car.dlc}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={saving}
            onClick={() => toggleStatus(car.id, "owned")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
              status.owned
                ? "bg-red-600 hover:bg-red-500"
                : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            {status.owned ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {status.owned ? "Possédée" : "Manquante"}
          </button>

          <button
            disabled={saving}
            onClick={() => toggleStatus(car.id, "photographed")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
              status.photographed
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            <Camera className="w-4 h-4" />
            {status.photographed ? "Photo OK" : "À photographier"}
          </button>
        </div>

        <button
          disabled={saving}
          onClick={() => toggleStatus(car.id, "favorite")}
          className={`w-full rounded-xl px-3 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
            status.favorite
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          <Star className={`w-4 h-4 ${status.favorite ? "fill-yellow-300" : ""}`} />
          {status.favorite ? "Favorite" : "Ajouter aux favorites"}
        </button>
      </div>
    </article>
  );
}