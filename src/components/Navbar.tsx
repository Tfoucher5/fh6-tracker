import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  UserRound,
  Rss,
  CalendarDays,
  Bell,
  Search,
  Trophy,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Car,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useUnreadCount } from "../features/notifications/hooks/useUnreadCount";
import { supabase } from "../lib/supabase";
import { prefetchRoute } from "../lib/prefetchRoute";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prefetch?: () => void;
};

const trackingLinks: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, prefetch: () => prefetchRoute(() => import("../pages/DashboardPage")) },
  { to: "/catalogue", label: "Catalogue", icon: BookOpen, prefetch: () => prefetchRoute(() => import("../pages/CataloguePage")) },
  { to: "/leaderboard", label: "Classement", icon: Trophy, prefetch: () => prefetchRoute(() => import("../pages/LeaderboardPage")) },
];

const communityLinks: NavItem[] = [
  { to: "/feed", label: "Feed", icon: Rss, prefetch: () => prefetchRoute(() => import("../pages/FeedPage")) },
  { to: "/events", label: "Événements", icon: CalendarDays, prefetch: () => prefetchRoute(() => import("../pages/EventsPage")) },
];

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const unreadCount = useUnreadCount();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setIsLoggedIn(false); return; }
      setIsLoggedIn(true);
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase.rpc("get_my_role"),
        supabase.from("profiles").select("username").eq("id", user.id).single(),
      ]);
      if (roleData === "admin" || roleData === "owner") setIsAdmin(true);
      if (profileData) setUsername(profileData.username);
    });
  }, []);

  const isActive = (to: string) => pathname.startsWith(to);
  const hasActiveLink = (items: NavItem[]) => items.some((item) => isActive(item.to));

  // Desktop "Compte" dropdown — items dépendent du username
  const accountLinks: NavItem[] = [
    { to: username ? `/u/${username}` : "/profile", label: "Mon profil", icon: UserRound },
    { to: "/profile", label: "Paramètres", icon: Settings },
    { to: "/search", label: "Recherche", icon: Search },
  ];

  function toggleDropdown(name: string) {
    setOpenDropdown((current) => (current === name ? null : name));
  }

  function closeMenus() {
    setOpenDropdown(null);
    setMobileOpen(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    closeMenus();
    navigate("/auth");
  }

  // Liens secondaires dans le menu mobile "Plus"
  const mobileSecondaryLinks: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/catalogue", label: "Catalogue", icon: BookOpen },
    { to: "/leaderboard", label: "Classement", icon: Trophy },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/60 bg-[#050810]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-14 px-4 flex items-center justify-between">
        <Link to="/feed" onClick={closeMenus} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/25 flex items-center justify-center">
            <Car className="w-5 h-5 text-red-400" />
          </div>

          <div className="leading-none">
            <span className="font-heading text-xl font-black tracking-widest text-white uppercase">
              FH6<span className="text-red-500">.</span>
            </span>
            <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 mt-1">
              Tracker
            </span>
          </div>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          <Dropdown
            name="community"
            label="Communauté"
            items={communityLinks}
            active={hasActiveLink(communityLinks)}
            openDropdown={openDropdown}
            toggleDropdown={toggleDropdown}
            closeMenus={closeMenus}
            isActive={isActive}
          />

          <Dropdown
            name="tracking"
            label="Suivi"
            items={trackingLinks}
            active={hasActiveLink(trackingLinks)}
            openDropdown={openDropdown}
            toggleDropdown={toggleDropdown}
            closeMenus={closeMenus}
            isActive={isActive}
          />

          {isLoggedIn ? (
            <>
              <Dropdown
                name="account"
                label="Compte"
                items={accountLinks}
                active={false}
                openDropdown={openDropdown}
                toggleDropdown={toggleDropdown}
                closeMenus={closeMenus}
                isActive={isActive}
                footer={
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                }
              />

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={closeMenus}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-red-600/20 text-red-400"
                      : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  }`}
                  aria-label="Administration"
                >
                  <ShieldCheck className="w-4 h-4" />
                </Link>
              )}

              <Link
                to="/inbox"
                onClick={closeMenus}
                aria-label="Notifications"
                className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  pathname.startsWith("/inbox")
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center px-1 leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </>
          ) : isLoggedIn === false ? (
            <Link
              to="/auth"
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold text-white transition-colors"
            >
              Se connecter
            </Link>
          ) : null}
        </nav>

        {/* Mobile — bouton "Plus" (secondaire uniquement, nav principale = BottomTabBar) */}
        <div className="md:hidden flex items-center gap-1" ref={mobileRef}>
          {isLoggedIn === false ? (
            <Link
              to="/auth"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold text-white transition-colors"
            >
              Se connecter
            </Link>
          ) : (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={closeMenus}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  aria-label="Administration"
                >
                  <ShieldCheck className="w-4 h-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                aria-label={mobileOpen ? "Fermer" : "Plus"}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu — nav secondaire + déconnexion (uniquement si connecté) */}
      {mobileOpen && isLoggedIn && (
        <div className="md:hidden border-t border-slate-800/60 bg-[#050810]/98 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-1">
            <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
              Navigation
            </p>
            {mobileSecondaryLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMenus}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(to)
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={closeMenus}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/admin")
                    ? "bg-red-600/20 text-red-400"
                    : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Administration
              </Link>
            )}

            <div className="my-1 h-px bg-slate-800" />

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

type DropdownProps = {
  name: string;
  label: string;
  items: NavItem[];
  active: boolean;
  openDropdown: string | null;
  toggleDropdown: (name: string) => void;
  closeMenus: () => void;
  isActive: (to: string) => boolean;
  unreadCount?: number;
  footer?: React.ReactNode;
};

function Dropdown({
  name,
  label,
  items,
  active,
  openDropdown,
  toggleDropdown,
  closeMenus,
  isActive,
  unreadCount,
  footer,
}: DropdownProps) {
  const open = openDropdown === name;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => toggleDropdown(name)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active || open
            ? "bg-slate-800 text-white"
            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
        }`}
      >
        {label}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl p-2">
          <div className="space-y-1">
            {items.map((item) => {
              const { to, label, icon: Icon } = item;
              const itemActive = isActive(to);
              const showBadge = to === "/inbox" && unreadCount && unreadCount > 0;

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenus}
                  onMouseEnter={item.prefetch}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    itemActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>

                  {showBadge && (
                    <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center px-1 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {footer && (
            <>
              <div className="my-2 h-px bg-slate-800" />
              {footer}
            </>
          )}
        </div>
      )}
    </div>
  );
}
