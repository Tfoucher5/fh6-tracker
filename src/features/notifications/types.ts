export type NotificationType = 'follow' | 'like' | 'comment' | 'reply' | 'event_join';

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  event_id: string | null;
  read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  post: {
    id: string;
    photo_url: string | null;
    caption: string | null;
    car: { make: string; model: string } | null;
  } | null;
  event: {
    id: string;
    title: string;
  } | null;
};
