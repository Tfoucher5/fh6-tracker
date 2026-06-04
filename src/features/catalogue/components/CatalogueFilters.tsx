import { Grid3X3, List, RotateCcw, Search } from "lucide-react";
import { favoriteOptions, garageOptions, photoOptions, sortOptions } from "../constants";
import type { SortOption } from "../types";
import type { useCatalogueFilters } from "../hooks/useCatalogueFilters";
import { FilterField } from "./FilterField";

type CatalogueFiltersProps = {
  filters: ReturnType<typeof useCatalogueFilters>;
};

export function CatalogueFilters({ filters }: CatalogueFiltersProps) {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2fr] gap-3">
        <FilterField label="Recherche">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

            <input
              value={filters.query}
              onChange={(e) => filters.setQuery(e.target.value)}
              placeholder="Rechercher marque, modèle, pays, classe..."
              className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-11 pr-4 py-3 outline-none focus:border-red-500"
            />
          </div>
        </FilterField>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <FilterField label="Marque">
            <select
              value={filters.makeFilter}
              onChange={(e) => filters.setMakeFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
            >
              {filters.makeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Pays">
            <select
              value={filters.countryFilter}
              onChange={(e) => filters.setCountryFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
            >
              {filters.countryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Type">
            <select
              value={filters.typeFilter}
              onChange={(e) => filters.setTypeFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
            >
              {filters.typeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Classe">
            <select
              value={filters.classFilter}
              onChange={(e) => filters.setClassFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
            >
              {filters.classOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FilterField>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <FilterField label="Garage">
          <select
            value={filters.garageFilter}
            onChange={(e) => filters.setGarageFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
          >
            {garageOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Photo">
          <select
            value={filters.photoFilter}
            onChange={(e) => filters.setPhotoFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
          >
            {photoOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Favoris">
          <select
            value={filters.favoriteFilter}
            onChange={(e) => filters.setFavoriteFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
          >
            {favoriteOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Tri">
          <select
            value={filters.sortBy}
            onChange={(e) => filters.setSortBy(e.target.value as SortOption)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>

        <button
          onClick={() =>
            filters.setViewMode(filters.viewMode === "cards" ? "compact" : "cards")
          }
          className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 font-semibold flex items-center justify-center gap-2 self-end"
        >
          {filters.viewMode === "cards" ? (
            <>
              <List className="w-5 h-5" />
              Compacte
            </>
          ) : (
            <>
              <Grid3X3 className="w-5 h-5" />
              Cartes
            </>
          )}
        </button>

        <button
          onClick={filters.resetFilters}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 font-semibold flex items-center justify-center gap-2 self-end"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>
    </>
  );
}
