import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { CarRow, UserCarRow } from "../types";
import { ClassBadge } from "../../../components/ClassBadge";

type ToggleField = "owned" | "photographed" | "favorite";

type CatalogueTableProps = {
  cars: CarRow[];
  getStatus: (carId: string) => UserCarRow;
  toggleStatus: (carId: string, field: ToggleField) => void;
  savingCarId: string | null;
};

export function CatalogueTable({ cars, getStatus, toggleStatus, savingCarId }: CatalogueTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/80">
      <table className="w-full text-sm">
        <thead className="bg-slate-950/60 text-slate-500">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest">Voiture</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest">Classe</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest">Pays</th>
            <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-widest">Garage</th>
            <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-widest">Photo</th>
            <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-widest">Fav</th>
          </tr>
        </thead>

        <tbody>
          {cars.map((car) => {
            const status = getStatus(car.id);
            const saving = savingCarId === car.id;

            return (
              <tr
                key={car.id}
                className="border-t border-slate-800/60 hover:bg-slate-800/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/cars/${car.id}`}
                    className="font-semibold text-white hover:text-red-400 transition-colors"
                  >
                    {car.year ?? "N/A"} · {car.make} {car.model}
                  </Link>
                  {car.availability && (
                    <p className="text-xs text-slate-600 mt-0.5">{car.availability}</p>
                  )}
                </td>

                <td className="px-4 py-3">
                  {car.car_class ? (
                    <ClassBadge carClass={car.car_class} pi={car.pi} size="sm" />
                  ) : (
                    <span className="text-slate-600 text-xs">—</span>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-400 text-xs">{car.car_type ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{car.country ?? "—"}</td>

                <td className="px-4 py-3 text-center">
                  <button
                    disabled={saving}
                    onClick={() => toggleStatus(car.id, "owned")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                      status.owned
                        ? "bg-red-600/90 hover:bg-red-500 text-white"
                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-400"
                    }`}
                  >
                    {status.owned ? "Possédée" : "Manquante"}
                  </button>
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    disabled={saving}
                    onClick={() => toggleStatus(car.id, "photographed")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                      status.photographed
                        ? "bg-emerald-600/90 hover:bg-emerald-500 text-white"
                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-400"
                    }`}
                  >
                    {status.photographed ? "Photo OK" : "À faire"}
                  </button>
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    disabled={saving}
                    onClick={() => toggleStatus(car.id, "favorite")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                      status.favorite
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-400"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 mx-auto ${status.favorite ? "fill-amber-300" : ""}`} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
