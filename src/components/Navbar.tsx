import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, UserRound, Rss, CalendarDays, Bell, Search, Trophy } from "lucide-react";
import { useUnreadCount } from "../features/notifications/hooks/useUnreadCount";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/catalogue", label: "Catalogue", icon: BookOpen },
  { to: "/feed", label: "Feed", icon: Rss },
  { to: "/events", label: "Événements", icon: CalendarDays },
  { to: "/profile", label: "Profil", icon: UserRound },
  { to: "/leaderboard", label: "Classement", icon: Trophy },
];

export function Navbar() {
  const { pathname } = useLocation();
  const unreadCount = useUnreadCount();

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-slate-800/60 bg-[#050810]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-heading text-xl font-black tracking-widest text-white uppercase leading-none">
            FH6<span className="text-red-500">.</span>
          </span>
          <span className="hidden sm:block h-4 w-px bg-slate-700" />
          <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Tracker
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {links.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}

          {/* Search */}
          <Link
            to="/search"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/search")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:block">Recherche</span>
          </Link>

          {/* Inbox / notifications */}
          <Link
            to="/inbox"
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/inbox")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center px-1 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            <span className="hidden sm:block">Inbox</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
