import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export function useSavedPosts() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id);

      setSavedIds(new Set((data ?? []).map((r: { post_id: string }) => r.post_id)));
      setLoading(false);
    })();
  }, []);

  async function toggleSave(postId: string) {
    if (!userId) return;
    const isSaved = savedIds.has(postId);

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(postId);
      else next.add(postId);
      return next;
    });

    if (isSaved) {
      await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("saved_posts").insert({ post_id: postId, user_id: userId });
    }
  }

  return { savedIds, toggleSave, userId, loading };
}
