import { useEffect, useState, useCallback } from "react";
import { X, Heart, MessageCircle, UserPlus, CornerDownRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { UserAvatar } from "../../social/components/UserAvatar";
import type { AppNotification } from "../types";

const NOTIF_SELECT = `
  id, user_id, actor_id, type, post_id, comment_id, event_id, read, created_at,
  actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url),
  post:posts(id, photo_url, caption, car:cars(make, model)),
  event:events(id, title)
` as const;

const ICONS = {
  follow: { Icon: UserPlus, color: "text-violet-400" },
  like: { Icon: Heart, color: "text-red-400" },
  comment: { Icon: MessageCircle, color: "text-blue-400" },
  reply: { Icon: CornerDownRight, color: "text-emerald-400" },
  event_join: { Icon: CalendarDays, color: "text-amber-400" },
} as const;

function toastText(n: AppNotification): string {
  const actor = n.actor.display_name ?? `@${n.actor.username}`;
  switch (n.type) {
    case "follow": return `${actor} s'est abonné à toi`;
    case "like": return `${actor} a aimé ton post`;
    case "comment": return `${actor} a commenté ton post`;
    case "reply": return `${actor} a répondu à ton commentaire`;
    case "event_join": return `${actor} a rejoint ton événement`;
  }
}

function toastLink(n: AppNotification): string {
  switch (n.type) {
    case "follow": return `/u/${n.actor.username}`;
    case "like":
    case "comment":
    case "reply": return "/feed";
    case "event_join": return n.event_id ? `/events/${n.event_id}` : "/events";
  }
}

type ToastItem = { id: string; notification: AppNotification };

export function NotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`toast-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            const { data } = await supabase
              .from("notifications")
              .select(NOTIF_SELECT)
              .eq("id", payload.new.id)
              .single();
            if (!data) return;

            const notif = data as unknown as AppNotification;
            const toastId = crypto.randomUUID();
            setToasts((prev) => [{ id: toastId, notification: notif }, ...prev].slice(0, 3));
            setTimeout(() => dismiss(toastId), 5000);
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => {
        const { Icon, color } = ICONS[t.notification.type];
        return (
          <Link
            key={t.id}
            to={toastLink(t.notification)}
            onClick={() => dismiss(t.id)}
            className="flex items-center gap-3 bg-[#0c1422] border border-slate-700/60 rounded-2xl px-4 py-3 shadow-2xl hover:border-slate-600 transition-colors animate-in slide-in-from-bottom-2"
          >
            <div className="relative shrink-0">
              <UserAvatar
                username={t.notification.actor.username}
                displayName={t.notification.actor.display_name}
                avatarUrl={t.notification.actor.avatar_url}
                size="sm"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                <Icon className={`w-2.5 h-2.5 ${color}`} />
              </div>
            </div>
            <p className="flex-1 text-xs text-white leading-tight">
              {toastText(t.notification)}
            </p>
            <button
              onClick={(e) => { e.preventDefault(); dismiss(t.id); }}
              className="text-slate-600 hover:text-white transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </Link>
        );
      })}
    </div>
  );
}
