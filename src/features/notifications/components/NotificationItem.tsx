import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, CornerDownRight, CalendarDays, Car } from "lucide-react";
import { UserAvatar } from "../../social/components/UserAvatar";
import type { AppNotification } from "../types";

type NotificationItemProps = {
  notification: AppNotification;
  onRead: (id: string) => void;
};

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const ICON_MAP = {
  follow: { Icon: UserPlus, color: "text-violet-400", bg: "bg-violet-500/15" },
  like: { Icon: Heart, color: "text-red-400", bg: "bg-red-500/15" },
  comment: { Icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-500/15" },
  reply: { Icon: CornerDownRight, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  event_join: { Icon: CalendarDays, color: "text-amber-400", bg: "bg-amber-500/15" },
} as const;

function notifText(n: AppNotification): string {
  const actor = n.actor.display_name ?? `@${n.actor.username}`;
  switch (n.type) {
    case "follow": return `${actor} s'est abonné à toi`;
    case "like": return `${actor} a aimé ton post`;
    case "comment": return `${actor} a commenté ton post`;
    case "reply": return `${actor} a répondu à ton commentaire`;
    case "event_join": return `${actor} a rejoint ton événement`;
  }
}

function notifLink(n: AppNotification): string {
  switch (n.type) {
    case "follow": return `/u/${n.actor.username}`;
    case "like":
    case "comment":
    case "reply": return n.post_id ? `/feed` : "/feed";
    case "event_join": return n.event_id ? `/events/${n.event_id}` : "/events";
  }
}

function PostThumbnail({ post }: { post: AppNotification["post"] }) {
  if (!post) return null;
  if (post.photo_url) {
    return (
      <img
        src={post.photo_url}
        alt="post"
        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-700/50"
      />
    );
  }
  if (post.car) {
    return (
      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
        <Car className="w-5 h-5 text-slate-600" />
      </div>
    );
  }
  return null;
}

export function NotificationItem({ notification: n, onRead }: NotificationItemProps) {
  const { Icon, color, bg } = ICON_MAP[n.type];

  return (
    <Link
      to={notifLink(n)}
      onClick={() => { if (!n.read) onRead(n.id); }}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-colors group ${
        n.read
          ? "border-slate-800/50 bg-slate-900/30 hover:border-slate-700"
          : "border-slate-700/60 bg-slate-900/70 hover:border-slate-600"
      }`}
    >
      {/* Unread dot */}
      <div className="w-2 shrink-0">
        {!n.read && <div className="w-2 h-2 rounded-full bg-red-500" />}
      </div>

      {/* Actor avatar + type icon */}
      <div className="relative shrink-0">
        <UserAvatar
          username={n.actor.username}
          displayName={n.actor.display_name}
          avatarUrl={n.actor.avatar_url}
          size="sm"
        />
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${bg} flex items-center justify-center border border-slate-900`}>
          <Icon className={`w-2.5 h-2.5 ${color}`} />
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${n.read ? "text-slate-400" : "text-white"}`}>
          {notifText(n)}
        </p>
        {n.type === "event_join" && n.event && (
          <p className="text-xs text-slate-600 font-mono mt-0.5 truncate">
            {n.event.title}
          </p>
        )}
        <p className="text-[10px] text-slate-600 font-mono mt-1">{relativeDate(n.created_at)}</p>
      </div>

      {/* Post thumbnail */}
      {(n.type === "like" || n.type === "comment" || n.type === "reply") && (
        <PostThumbnail post={n.post} />
      )}
    </Link>
  );
}
