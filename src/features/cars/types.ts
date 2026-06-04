export type CarDetail = {
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
  source_url: string | null;
};

export type UserCarDetail = {
  user_id: string;
  car_id: string;
  owned: boolean;
  photographed: boolean;
  favorite: boolean;
  wanted: boolean;
  notes: string | null;
  acquired_at: string | null;
  photographed_at: string | null;
};

export type CarPhoto = {
  id: string;
  car_id: string;
  user_id: string;
  storage_path: string;
  image_url: string;
  caption: string | null;
  is_public: boolean;
  is_primary: boolean;
  created_at: string;
};