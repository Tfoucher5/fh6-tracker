import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export function useFollows(targetUserId: string) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;
    loadData();
  }, [targetUserId]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", targetUserId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetUserId),
    ]);

    setFollowers(followersCount ?? 0);
    setFollowing(followingCount ?? 0);

    if (user && user.id !== targetUserId) {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      setIsFollowing(!!data);
    }

    setInitialized(true);
  }

  async function toggleFollow() {
    if (!currentUserId || currentUserId === targetUserId) return;
    setLoading(true);

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", targetUserId);
      setIsFollowing(false);
      setFollowers((prev) => Math.max(0, prev - 1));
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: targetUserId });
      setIsFollowing(true);
      setFollowers((prev) => prev + 1);
    }

    setLoading(false);
  }

  return { currentUserId, followers, following, isFollowing, loading, initialized, toggleFollow };
}
