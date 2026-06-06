import { Link } from "react-router-dom";
import { ArrowLeft, Car } from "lucide-react";
import type { CarDetail } from "../types";
import { ClassBadge } from "../../../components/ClassBadge";
import { transformImage } from "../../../lib/imageTransform";

type CarDetailHeaderProps = {
  car: CarDetail;
};

export function CarDetailHeader({ car }: CarDetailHeaderProps) {
  const title = `${car.year ?? "N/A"} · ${car.make} ${car.model}`;

  return (
    <header className="space-y-4">
      <Link
        to="/catalogue"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour au catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
        <div className="h-72 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-center overflow-hidden">
          {car.image_url ? (
            <img
              src={transformImage(car.image_url, 900) ?? car.image_url}
              alt={title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <Car className="w-20 h-20 text-slate-700" />
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-3">
            FH6 Tracker
          </p>

          <h1 className="font-heading font-black text-4xl uppercase tracking-wide text-white leading-tight">
            {car.make} {car.model}
          </h1>
          <p className="font-mono text-slate-500 text-sm mt-1">{car.year ?? "N/A"}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            <InfoCard label="Classe">
              {car.car_class ? (
                <ClassBadge carClass={car.car_class} pi={car.pi} size="sm" />
              ) : (
                <span className="text-slate-500 text-sm">—</span>
              )}
            </InfoCard>
            <InfoCard label="Type" value={car.car_type ?? "—"} />
            <InfoCard label="Pays" value={car.country ?? "—"} />
            <InfoCard label="Source" value={car.availability ?? "—"} />
            <InfoCard label="DLC" value={car.dlc ?? "—"} />
            <InfoCard label="Année" value={car.year ? String(car.year) : "—"} />
          </div>
        </div>
      </div>
    </header>
  );
}

function InfoCard({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-1">{label}</p>
      {children ?? <p className="font-semibold text-sm text-white">{value}</p>}
    </div>
  );
}
