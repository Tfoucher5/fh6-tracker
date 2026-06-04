import type { SortOption } from "./types";

export const PAGE_SIZE = 60;

export const garageOptions = ["Toutes", "Possédées", "Manquantes"];

export const photoOptions = [
  "Toutes",
  "Photographiées",
  "Non photographiées",
];

export const favoriteOptions = ["Toutes", "Favorites", "Non favorites"];

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "make_asc", label: "Marque A-Z" },
  { value: "make_desc", label: "Marque Z-A" },
  { value: "year_asc", label: "Année croissante" },
  { value: "year_desc", label: "Année décroissante" },
  { value: "pi_asc", label: "PI croissant" },
  { value: "pi_desc", label: "PI décroissant" },
  { value: "class_asc", label: "Classe" },
];

export const classOrder = ["D", "C", "B", "A", "S1", "S2", "R", "X"];
