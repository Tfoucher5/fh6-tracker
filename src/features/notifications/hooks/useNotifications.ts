import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { AppNotification } from "../types";

const NOTIF_SELECT = `
  id, user_id, actor_id, type, post_id, comment_id, event_id, read, created_at,
  actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url),
  post:posts(id, photo_url, caption, car:cars(make, model)),
  event:events(id, title)
` as const;

export function useNotifications() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      await load(user.id);

      channel = supabase
        .channel(`notifs-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            // Re-fetch to get full joined data for the new notification
            await load(user.id);
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function load(uid: string) {
    const { data } = await supabase
      .from("notifications")
      .select(NOTIF_SELECT)
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);

    const notifs = (data ?? []) as unknown as AppNotification[];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.read).length);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async function markAllAsRead() {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
  }

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}
