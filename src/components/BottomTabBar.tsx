import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Rss, CalendarDays, Search, Bell, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useUnreadCount } from "../features/notifications/hooks/useUnreadCount";
import { prefetchRoute } from "../lib/prefetchRoute";

export function BottomTabBar() {
  const { pathname } = useLocation();
  const [username, setUsername] = useState<string | null>(null);
  const unreadCount = useUnreadCount();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (data) setUsername(data.username);
    });
  }, []);

  const profileTo = username ? `/u/${username}` : "/auth";

  function isActive(to: string) {
    if (to === "/feed") return pathname === "/feed";
    if (to === profileTo && username) return pathname === `/u/${username}`;
    return pathname.startsWith(to);
  }

  const tabs = [
    { to: "/feed", label: "Feed", Icon: Rss, badge: 0, prefetchFn: () => prefetchRoute(() => import("../pages/FeedPage")) },
    { to: "/events", label: "Events", Icon: CalendarDays, badge: 0, prefetchFn: () => prefetchRoute(() => import("../pages/EventsPage")) },
    { to: "/search", label: "Recherche", Icon: Search, badge: 0, prefetchFn: () => prefetchRoute(() => import("../pages/SearchPage")) },
    { to: "/inbox", label: "Inbox", Icon: Bell, badge: unreadCount, prefetchFn: () => prefetchRoute(() => import("../pages/InboxPage")) },
    { to: profileTo, label: "Profil", Icon: UserRound, badge: 0, prefetchFn: () => prefetchRoute(() => import("../pages/PublicProfilePage")) },
  ];

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-[#050810]/95 backdrop-blur-sm border-t border-slate-800/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-14">
        {tabs.map(({ to, label, Icon, badge, prefetchFn }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onMouseEnter={prefetchFn}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] rounded-full bg-red-500 text-[8px] font-black text-white flex items-center justify-center px-0.5 leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-semibold uppercase tracking-wider leading-none ${active ? "text-white" : "text-slate-600"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
