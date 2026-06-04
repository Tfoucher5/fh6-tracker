export type FHEvent = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location_in_game: string | null;
  cover_image_url: string | null;
  max_participants: number | null;
  is_public: boolean;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  event_participants: { user_id: string }[];
};

export type EventWithDetails = FHEvent & {
  event_participants: {
    user_id: string;
    joined_at: string;
    profile: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  }[];
};

export type CreateEventInput = {
  title: string;
  description: string;
  event_date: string;
  location_in_game: string;
  max_participants: number | null;
};
