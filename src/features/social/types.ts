export type FeedPost = {
  id: string;
  user_id: string;
  car_id: string | null;
  photo_url: string | null;
  storage_path: string | null;
  caption: string | null;
  created_at: string;
  status: string;
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  car: {
    id: string;
    make: string;
    model: string;
    year: number | null;
    car_class: string | null;
    pi: number | null;
    image_url: string | null;
  } | null;
  post_likes: { user_id: string }[];
  post_comments: { id: string }[];
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  status: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  comment_likes: { user_id: string }[];
  replies?: PostComment[];
};

export type CarSearchResult = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  car_class: string | null;
  pi: number | null;
  image_url: string | null;
};

export type FollowCounts = {
  followers: number;
  following: number;
};
