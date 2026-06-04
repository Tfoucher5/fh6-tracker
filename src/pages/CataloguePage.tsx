import { Link } from "react-router-dom";
import { useCatalogueData } from "../features/catalogue/hooks/useCatalogueData";
import { useCatalogueFilters } from "../features/catalogue/hooks/useCatalogueFilters";
import { CatalogueStats } from "../features/catalogue/components/CatalogueStats";
import { CatalogueFilters } from "../features/catalogue/components/CatalogueFilters";
import { CatalogueCard } from "../features/catalogue/components/CatalogueCard";
import { CatalogueTable } from "../features/catalogue/components/CatalogueTable";
import { LoadMoreButton } from "../features/catalogue/components/LoadMoreButton";
import { PAGE_SIZE } from "../features/catalogue/constants";

export default function CataloguePage() {
  const {
    cars,
    loading,
    savingCarId,
    message,
    getStatus,
    toggleStatus,
  } = useCatalogueData();

  const filters = useCatalogueFilters({
    cars,
    getStatus,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Chargement du catalogue...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-red-400">
              FH6 Tracker
            </p>
            <h1 className="text-4xl font-bold mt-2">Catalogue voitures</h1>
            <p className="text-slate-400 mt-2">
              Suis ton garage et ta progression Horizon Promo.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2"
            >
              Dashboard
            </Link>

            <Link
              to="/profile"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2"
            >
              Profil
            </Link>
          </div>
        </header>

        <CatalogueStats cars={cars} getStatus={getStatus} />

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <CatalogueFilters filters={filters} />

          {message && (
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-3 text-sm text-slate-300">
              {message}
            </div>
          )}

          <p className="text-sm text-slate-500">
            {filters.filteredCars.length} résultat(s)
          </p>

          {filters.viewMode === "compact" ? (
            <CatalogueTable
              cars={filters.visibleCars}
              getStatus={getStatus}
              toggleStatus={toggleStatus}
              savingCarId={savingCarId}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filters.visibleCars.map((car) => (
                <CatalogueCard
                  key={car.id}
                  car={car}
                  status={getStatus(car.id)}
                  saving={savingCarId === car.id}
                  toggleStatus={toggleStatus}
                />
              ))}
            </div>
          )}

          <LoadMoreButton
            visibleCount={filters.visibleCount}
            totalCount={filters.filteredCars.length}
            onLoadMore={() => filters.setVisibleCount((v) => v + PAGE_SIZE)}
          />
        </section>
      </div>
    </div>
  );
}