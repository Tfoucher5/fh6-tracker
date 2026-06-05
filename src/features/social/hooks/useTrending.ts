import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { FeedPost } from "../types";

const POST_SELECT = `
  id, user_id, car_id, photo_url, storage_path, caption, created_at, status,
  profile:profiles!posts_user_id_fkey(id, username, display_name, avatar_url),
  car:cars(id, make, model, year, car_class, pi, image_url),
  post_likes(user_id),
  post_comments(id)
` as const;

export function useTrending() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(60);

    const sorted = ((data ?? []) as unknown as FeedPost[])
      .filter((p) => p.post_likes.length > 0)
      .sort((a, b) => b.post_likes.length - a.post_likes.length)
      .slice(0, 3);

    setPosts(sorted);
    setLoading(false);
  }

  return { posts, loading };
}
