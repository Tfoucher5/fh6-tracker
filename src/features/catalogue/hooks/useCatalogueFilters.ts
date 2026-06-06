import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PAGE_SIZE } from "../constants";
import type { CarRow, SortOption, UserCarRow, ViewMode } from "../types";
import { classRank, compareNumber, compareText, uniqueSorted } from "../utils";

type Params = {
  cars: CarRow[];
  getStatus: (carId: string) => UserCarRow;
};

function garageFromParam(value: string | null) {
  if (value === "missing") return "Manquantes";
  if (value === "owned") return "Possédées";
  return "Toutes";
}

function photoFromParam(value: string | null) {
  if (value === "missing") return "Non photographiées";
  if (value === "done") return "Photographiées";
  return "Toutes";
}

function favoriteFromParam(value: string | null) {
  if (value === "true") return "Favorites";
  if (value === "false") return "Non favorites";
  return "Toutes";
}

export function useCatalogueFilters({ cars, getStatus }: Params) {
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [makeFilter, setMakeFilter] = useState("Toutes");
  const [countryFilter, setCountryFilter] = useState("Toutes");
  const [typeFilter, setTypeFilter] = useState("Toutes");
  const [classFilter, setClassFilter] = useState("Toutes");
  const [garageFilter, setGarageFilter] = useState("Toutes");
  const [photoFilter, setPhotoFilter] = useState("Toutes");
  const [favoriteFilter, setFavoriteFilter] = useState("Toutes");
  const [sortBy, setSortBy] = useState<SortOption>("make_asc");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setGarageFilter(garageFromParam(searchParams.get("garage")));
    setPhotoFilter(photoFromParam(searchParams.get("photo")));
    setFavoriteFilter(favoriteFromParam(searchParams.get("favorite")));

    const search = searchParams.get("q");
    if (search) {
      setQuery(search);
    }

    setVisibleCount(PAGE_SIZE);
  }, [searchParams]);

  const makeOptions = useMemo(
    () => ["Toutes", ...uniqueSorted(cars.map((c) => c.make))],
    [cars]
  );

  const countryOptions = useMemo(
    () => ["Toutes", ...uniqueSorted(cars.map((c) => c.country))],
    [cars]
  );

  const typeOptions = useMemo(
    () => ["Toutes", ...uniqueSorted(cars.map((c) => c.car_type))],
    [cars]
  );

  const classOptions = useMemo(() => {
    const classes = uniqueSorted(cars.map((c) => c.car_class));
    return ["Toutes", ...classes.sort((a, b) => classRank(a) - classRank(b))];
  }, [cars]);

  const filteredCars = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = cars.filter((car) => {
      const status = getStatus(car.id);

      const text = [
        car.make,
        car.model,
        car.year,
        car.country,
        car.car_type,
        car.car_class,
        car.pi,
        car.availability,
        car.dlc,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!q || text.includes(q)) &&
        (makeFilter === "Toutes" || car.make === makeFilter) &&
        (countryFilter === "Toutes" || car.country === countryFilter) &&
        (typeFilter === "Toutes" || car.car_type === typeFilter) &&
        (classFilter === "Toutes" || car.car_class === classFilter) &&
        (garageFilter === "Toutes" ||
          (garageFilter === "Possédées" && status.owned) ||
          (garageFilter === "Manquantes" && !status.owned)) &&
        (photoFilter === "Toutes" ||
          (photoFilter === "Photographiées" && status.photographed) ||
          (photoFilter === "Non photographiées" && !status.photographed)) &&
        (favoriteFilter === "Toutes" ||
          (favoriteFilter === "Favorites" && status.favorite) ||
          (favoriteFilter === "Non favorites" && !status.favorite))
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "make_asc":
          return compareText(a.make, b.make) || compareText(a.model, b.model);

        case "make_desc":
          return compareText(b.make, a.make) || compareText(b.model, a.model);

        case "year_asc":
          return compareNumber(a.year, b.year) || compareText(a.make, b.make);

        case "year_desc":
          return compareNumber(b.year, a.year) || compareText(a.make, b.make);

        case "pi_asc":
          return compareNumber(a.pi, b.pi) || compareText(a.make, b.make);

        case "pi_desc":
          return compareNumber(b.pi, a.pi) || compareText(a.make, b.make);

        case "class_asc":
          return (
            classRank(a.car_class) - classRank(b.car_class) ||
            compareNumber(a.pi, b.pi) ||
            compareText(a.make, b.make)
          );

        default:
          return 0;
      }
    });

    return result;
  }, [
    cars,
    getStatus,
    query,
    makeFilter,
    countryFilter,
    typeFilter,
    classFilter,
    garageFilter,
    photoFilter,
    favoriteFilter,
    sortBy,
  ]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    query,
    makeFilter,
    countryFilter,
    typeFilter,
    classFilter,
    garageFilter,
    photoFilter,
    favoriteFilter,
    sortBy,
  ]);

  function resetFilters() {
    setQuery("");
    setMakeFilter("Toutes");
    setCountryFilter("Toutes");
    setTypeFilter("Toutes");
    setClassFilter("Toutes");
    setGarageFilter("Toutes");
    setPhotoFilter("Toutes");
    setFavoriteFilter("Toutes");
    setSortBy("make_asc");
  }

  const visibleCars = useMemo(
    () => filteredCars.slice(0, visibleCount),
    [filteredCars, visibleCount]
  );

  return {
    query,
    setQuery,

    makeFilter,
    setMakeFilter,

    countryFilter,
    setCountryFilter,

    typeFilter,
    setTypeFilter,

    classFilter,
    setClassFilter,

    garageFilter,
    setGarageFilter,

    photoFilter,
    setPhotoFilter,

    favoriteFilter,
    setFavoriteFilter,

    sortBy,
    setSortBy,

    viewMode,
    setViewMode,

    visibleCount,
    setVisibleCount,

    makeOptions,
    countryOptions,
    typeOptions,
    classOptions,

    filteredCars,
    visibleCars,

    resetFilters,
  };
}