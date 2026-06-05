import { useEffect } from "react";
import { useCatalogueData } from "../features/catalogue/hooks/useCatalogueData";
import { useCatalogueFilters } from "../features/catalogue/hooks/useCatalogueFilters";
import { CatalogueStats } from "../features/catalogue/components/CatalogueStats";
import { CatalogueFilters } from "../features/catalogue/components/CatalogueFilters";
import { CatalogueCard } from "../features/catalogue/components/CatalogueCard";
import { CatalogueTable } from "../features/catalogue/components/CatalogueTable";
import { LoadMoreButton } from "../features/catalogue/components/LoadMoreButton";
import { PAGE_SIZE } from "../features/catalogue/constants";
import { PageLayout } from "../components/PageLayout";

export default function CataloguePage() {
  const { cars, loading, savingCarId, message, getStatus, toggleStatus } = useCatalogueData();
  const filters = useCatalogueFilters({ cars, getStatus });

  useEffect(() => { document.title = "Catalogue — FH6 Tracker"; }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center">
        <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-400 animate-pulse">
          Chargement…
        </p>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">
              FH6 Tracker
            </p>
            <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">
              Catalogue
            </h1>
            <p className="text-slate-400 mt-2">
              Suis ton garage et ta progression Horizon Promo.
            </p>
          </header>

          <CatalogueStats cars={cars} getStatus={getStatus} />

          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <CatalogueFilters filters={filters} />

            {message && (
              <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-3 text-sm text-slate-300">
                {message}
              </div>
            )}

            <p className="text-xs font-mono text-slate-600">
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
    </PageLayout>
  );
}
