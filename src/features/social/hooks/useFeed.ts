import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type { FeedPost } from "../types";

const PAGE_SIZE = 20;

const POST_SELECT = `
  id, user_id, car_id, photo_url, storage_path, caption, created_at,
  profile:profiles!posts_user_id_fkey(id, username, display_name, avatar_url),
  car:cars(id, make, model, year, car_class, pi, image_url),
  post_likes(user_id),
  post_comments(id)
` as const;

export function useFeed(filter: "all" | "following") {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const loadPosts = useCallback(
    async (offset: number, currentUser: User | null, reset: boolean) => {
      let userIds: string[] | null = null;

      if (filterRef.current === "following" && currentUser) {
        const { data: followData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", currentUser.id);

        userIds = (followData ?? []).map((f) => f.following_id);
        if (userIds.length === 0) {
          if (reset) setPosts([]);
          setHasMore(false);
          return;
        }
      }

      let query = supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (userIds) {
        query = query.in("user_id", userIds);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[useFeed] query error:", error);
        setError(error.message);
        return;
      }
      if (!data) return;
      setError(null);

      const newPosts = data as unknown as FeedPost[];
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(newPosts.length === PAGE_SIZE);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPosts([]);
    setHasMore(true);

    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(currentUser);
      await loadPosts(0, currentUser, true);
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [filter, loadPosts]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await loadPosts(posts.length, currentUser, false);
    setLoadingMore(false);
  }

  function toggleLike(postId: string) {
    if (!user) return;
    const userId = user.id;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const liked = post.post_likes.some((l) => l.user_id === userId);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          post_likes: liked
            ? p.post_likes.filter((l) => l.user_id !== userId)
            : [...p.post_likes, { user_id: userId }],
        };
      })
    );

    if (liked) {
      supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId).then(() => {});
    } else {
      supabase.from("post_likes").insert({ post_id: postId, user_id: userId }).then(() => {});
    }
  }

  function incrementCommentCount(postId: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, post_comments: [...p.post_comments, { id: "tmp" }] } : p
      )
    );
  }

  function deletePost(postId: string) {
    const post = posts.find((p) => p.id === postId);
    if (!post || post.user_id !== user?.id) return;

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .then(async () => {
        if (post.storage_path) {
          await supabase.storage.from("post-photos").remove([post.storage_path]);
        }
      });
  }

  function removePostFromFeed(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function addPost(post: FeedPost) {
    setPosts((prev) => [post, ...prev]);
  }

  return {
    user,
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    toggleLike,
    incrementCommentCount,
    deletePost,
    removePostFromFeed,
    addPost,
  };
}
