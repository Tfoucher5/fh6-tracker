import type { CarRow, UserCarRow } from "../types";

type CatalogueStatsProps = {
  cars: CarRow[];
  getStatus: (carId: string) => UserCarRow;
};

export function CatalogueStats({ cars, getStatus }: CatalogueStatsProps) {
  const ownedCount = cars.filter((car) => getStatus(car.id).owned).length;
  const photographedCount = cars.filter((car) => getStatus(car.id).photographed).length;
  const favoriteCount = cars.filter((car) => getStatus(car.id).favorite).length;
  const missingCount = cars.length - ownedCount;
  const remainingPhotosCount = cars.length - photographedCount;
  const ownedPercent = cars.length > 0 ? Math.round((ownedCount / cars.length) * 100) : 0;
  const photoPercent = cars.length > 0 ? Math.round((photographedCount / cars.length) * 100) : 0;

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Catalogue"
        value={String(cars.length)}
        sub="référencées"
      />

      <ProgressStatCard
        label="Garage"
        value={`${ownedCount}/${cars.length}`}
        sub={`${missingCount} manquante(s)`}
        percent={ownedPercent}
        barColor="bg-red-500"
        barGlow="shadow-[0_0_8px_0px_rgba(239,68,68,0.6)]"
      />

      <ProgressStatCard
        label="Horizon Promo"
        value={`${photographedCount}/${cars.length}`}
        sub={`${remainingPhotosCount} restante(s)`}
        percent={photoPercent}
        barColor="bg-emerald-500"
        barGlow="shadow-[0_0_8px_0px_rgba(16,185,129,0.6)]"
      />

      <StatCard
        label="Favorites"
        value={String(favoriteCount)}
        sub="marquée(s)"
      />
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">{label}</p>
      <p className="font-heading font-black text-4xl text-white leading-none">{value}</p>
      <p className="text-slate-600 text-xs mt-2">{sub}</p>
    </div>
  );
}

function ProgressStatCard({
  label,
  value,
  sub,
  percent,
  barColor,
  barGlow,
}: {
  label: string;
  value: string;
  sub: string;
  percent: number;
  barColor: string;
  barGlow: string;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">{label}</p>
      <p className="font-heading font-black text-4xl text-white leading-none">{value}</p>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
        <div
          className={`h-full rounded-full ${barColor} ${barGlow} transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-slate-600 text-xs mt-2">
        {percent}% · {sub}
      </p>
    </div>
  );
}
