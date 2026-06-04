import { Link } from "react-router-dom";
import { CheckCheck, BellOff } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { NotificationItem } from "../features/notifications/components/NotificationItem";
import { useNotifications } from "../features/notifications/hooks/useNotifications";
import type { AppNotification } from "../features/notifications/types";

type DateGroup = {
  label: string;
  items: AppNotification[];
};

function groupByDate(notifications: AppNotification[]): DateGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 6 * 86400000;

  const today: AppNotification[] = [];
  const thisWeek: AppNotification[] = [];
  const older: AppNotification[] = [];

  for (const n of notifications) {
    const t = new Date(n.created_at).getTime();
    if (t >= todayStart) today.push(n);
    else if (t >= weekStart) thisWeek.push(n);
    else older.push(n);
  }

  const groups: DateGroup[] = [];
  if (today.length) groups.push({ label: "Aujourd'hui", items: today });
  if (thisWeek.length) groups.push({ label: "Cette semaine", items: thisWeek });
  if (older.length) groups.push({ label: "Plus ancien", items: older });
  return groups;
}

export default function InboxPage() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const groups = groupByDate(notifications);

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">
                Communauté
              </p>
              <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-slate-400 mt-2 text-sm">
                  <span className="text-white font-semibold">{unreadCount}</span> non lue{unreadCount > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors shrink-0"
              >
                <CheckCheck className="w-4 h-4" />
                Tout lire
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <LoadingState />
          ) : notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.label} className="space-y-2">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600 px-1">
                    {group.label}
                  </h2>
                  <div className="space-y-1.5">
                    {group.items.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onRead={markAsRead}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-800/50 bg-slate-900/30 animate-pulse"
        >
          <div className="w-2 shrink-0" />
          <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-800 rounded w-3/4" />
            <div className="h-2 bg-slate-800/60 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center">
        <BellOff className="w-7 h-7 text-slate-600" />
      </div>
      <p className="font-heading font-bold text-xl uppercase text-slate-500">
        Aucune notification
      </p>
      <p className="text-sm text-slate-600 max-w-xs">
        Les likes, commentaires, abonnements et rejoins d'événements apparaîtront ici en temps réel.
      </p>
      <Link
        to="/feed"
        className="mt-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold transition-colors"
      >
        Aller sur le feed
      </Link>
    </div>
  );
}
