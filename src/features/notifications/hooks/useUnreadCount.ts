import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: unread } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setCount(unread ?? 0);

      channel = supabase
        .channel(`unread-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => setCount((prev) => prev + 1)
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            const { count: fresh } = await supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("read", false);
            setCount(fresh ?? 0);
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
