export type CarRow = {
  id: string;
  source_key: string;
  make: string;
  model: string;
  year: number | null;
  car_type: string | null;
  car_class: string | null;
  pi: number | null;
  country: string | null;
  availability: string | null;
  dlc: string | null;
  image_url: string | null;
};

export type UserCarRow = {
  user_id: string;
  car_id: string;
  owned: boolean;
  photographed: boolean;
  favorite: boolean;
  acquired_at: string | null;
  photographed_at: string | null;
};

export type StatusMap = Record<string, UserCarRow>;

export type SortOption =
  | "make_asc"
  | "make_desc"
  | "year_asc"
  | "year_desc"
  | "pi_asc"
  | "pi_desc"
  | "class_asc";

export type ViewMode = "cards" | "compact";