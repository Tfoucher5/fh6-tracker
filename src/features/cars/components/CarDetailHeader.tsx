import { Link } from "react-router-dom";
import { ArrowLeft, Car } from "lucide-react";
import type { CarDetail } from "../types";

type CarDetailHeaderProps = {
  car: CarDetail;
};

export function CarDetailHeader({ car }: CarDetailHeaderProps) {
  const title = `${car.year ?? "N/A"} · ${car.make} ${car.model}`;

  return (
    <header className="space-y-4">
      <Link
        to="/catalogue"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
        <div className="h-72 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
          {car.image_url ? (
            <img
              src={car.image_url}
              alt={title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <Car className="w-20 h-20 text-slate-600" />
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-red-400">
            FH6 Tracker
          </p>

          <h1 className="text-4xl font-bold mt-3">{title}</h1>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            <Info
              label="Classe"
              value={
                car.car_class
                  ? `${car.car_class}${car.pi ? ` ${car.pi}` : ""}`
                  : "-"
              }
            />
            <Info label="Type" value={car.car_type ?? "-"} />
            <Info label="Pays" value={car.country ?? "-"} />
            <Info label="Source" value={car.availability ?? "-"} />
            <Info label="DLC" value={car.dlc ?? "-"} />
            <Info label="Année" value={car.year ? String(car.year) : "-"} />
          </div>
        </div>
      </div>
    </header>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold mt-1">{value}</p>
    </div>
  );
}