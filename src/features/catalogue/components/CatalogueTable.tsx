import { Star } from "lucide-react";
import type { CarRow, UserCarRow } from "../types";
import { Link } from "react-router-dom";

type ToggleField = "owned" | "photographed" | "favorite";

type CatalogueTableProps = {
  cars: CarRow[];
  getStatus: (carId: string) => UserCarRow;
  toggleStatus: (carId: string, field: ToggleField) => void;
  savingCarId: string | null;
};

export function CatalogueTable({
  cars,
  getStatus,
  toggleStatus,
  savingCarId,
}: CatalogueTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-950 text-slate-400">
          <tr>
            <th className="text-left px-4 py-3">Voiture</th>
            <th className="text-left px-4 py-3">Classe</th>
            <th className="text-left px-4 py-3">Type</th>
            <th className="text-left px-4 py-3">Pays</th>
            <th className="text-center px-4 py-3">Garage</th>
            <th className="text-center px-4 py-3">Photo</th>
            <th className="text-center px-4 py-3">Fav</th>
          </tr>
        </thead>

        <tbody>
          {cars.map((car) => {
            const status = getStatus(car.id);
            const saving = savingCarId === car.id;

            return (
              <tr
                key={car.id}
                className="border-t border-slate-800 hover:bg-slate-800/40"
              >
                <td className="px-4 py-3">
                  <div>
                    <Link
                      to={`/cars/${car.id}`}
                      className="font-semibold text-white hover:text-red-300 transition-colors"
                    >
                      {car.year ?? "N/A"} · {car.make} {car.model}
                    </Link>
                    {car.availability && (
                      <p className="text-xs text-slate-500">
                        {car.availability}
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  {car.car_class ? (
                    <span className="rounded-full bg-red-500/15 border border-red-500/20 text-red-300 px-3 py-1 text-xs font-semibold">
                      {car.car_class}
                      {car.pi ? ` ${car.pi}` : ""}
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-300">
                  {car.car_type ?? "-"}
                </td>

                <td className="px-4 py-3 text-slate-300">
                  {car.country ?? "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    disabled={saving}
                    onClick={() => toggleStatus(car.id, "owned")}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      status.owned
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {status.owned ? "Possédée" : "Manquante"}
                  </button>
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    disabled={saving}
                    onClick={() => toggleStatus(car.id, "photographed")}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      status.photographed
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {status.photographed ? "Photo OK" : "À faire"}
                  </button>
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    disabled={saving}
                    onClick={() => toggleStatus(car.id, "favorite")}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      status.favorite
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 mx-auto ${
                        status.favorite ? "fill-yellow-300" : ""
                      }`}
                    />
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