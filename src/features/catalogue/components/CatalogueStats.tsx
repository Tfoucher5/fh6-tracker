import type { CarRow, UserCarRow } from "../types";

type CatalogueStatsProps = {
  cars: CarRow[];
  getStatus: (carId: string) => UserCarRow;
};

export function CatalogueStats({ cars, getStatus }: CatalogueStatsProps) {
  const ownedCount = cars.filter((car) => getStatus(car.id).owned).length;

  const photographedCount = cars.filter(
    (car) => getStatus(car.id).photographed
  ).length;

  const favoriteCount = cars.filter((car) => getStatus(car.id).favorite).length;

  const missingCount = cars.length - ownedCount;
  const remainingPhotosCount = cars.length - photographedCount;

  const ownedPercent =
    cars.length > 0 ? Math.round((ownedCount / cars.length) * 100) : 0;

  const photoPercent =
    cars.length > 0 ? Math.round((photographedCount / cars.length) * 100) : 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-400 text-sm">Catalogue</p>
        <p className="text-3xl font-bold mt-1">{cars.length}</p>
        <p className="text-slate-500 text-sm mt-1">voitures référencées</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-400 text-sm">Garage</p>
        <p className="text-3xl font-bold mt-1">
          {ownedCount}/{cars.length}
        </p>

        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-red-500 rounded-full"
            style={{ width: `${ownedPercent}%` }}
          />
        </div>

        <p className="text-slate-500 text-sm mt-2">
          {missingCount} voiture(s) manquante(s)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-400 text-sm">Horizon Promo</p>
        <p className="text-3xl font-bold mt-1">
          {photographedCount}/{cars.length}
        </p>

        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${photoPercent}%` }}
          />
        </div>

        <p className="text-slate-500 text-sm mt-2">
          {remainingPhotosCount} photo(s) restante(s)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-400 text-sm">Favorites</p>
        <p className="text-3xl font-bold mt-1">{favoriteCount}</p>
        <p className="text-slate-500 text-sm mt-1">voiture(s) marquée(s)</p>
      </div>
    </section>
  );
}