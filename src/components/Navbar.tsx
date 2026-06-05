import { useState } from "react";
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
} from "lucide-react";
import { useUnreadCount } from "../features/notifications/hooks/useUnreadCount";
import { supabase } from "../lib/supabase";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const trackingLinks: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/catalogue", label: "Catalogue", icon: BookOpen },
  { to: "/leaderboard", label: "Classement", icon: Trophy },
];

const communityLinks: NavItem[] = [
  { to: "/feed", label: "Feed", icon: Rss },
  { to: "/events", label: "Événements", icon: CalendarDays },
];

const accountLinks: NavItem[] = [
  { to: "/profile", label: "Profil", icon: UserRound },
  { to: "/search", label: "Recherche", icon: Search },
  { to: "/inbox", label: "Inbox", icon: Bell },
];

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const unreadCount = useUnreadCount();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) => {
    return to === "/" ? pathname === "/" : pathname.startsWith(to);
  };

  const hasActiveLink = (items: NavItem[]) => {
    return items.some((item) => isActive(item.to));
  };

  function toggleDropdown(name: string) {
    setOpenDropdown((current) => (current === name ? null : name));
  }

  function closeMenus() {
    setOpenDropdown(null);
    setMobileOpen(false);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erreur lors de la déconnexion :", error.message);
      return;
    }

    closeMenus();
    navigate("/auth");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/60 bg-[#050810]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-14 px-4 flex items-center justify-between">
        <Link to="/" onClick={closeMenus} className="flex items-center gap-3">
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
            name="tracking"
            label="Suivi"
            items={trackingLinks}
            active={hasActiveLink(trackingLinks)}
            openDropdown={openDropdown}
            toggleDropdown={toggleDropdown}
            closeMenus={closeMenus}
            isActive={isActive}
          />

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
            name="account"
            label="Compte"
            items={accountLinks}
            active={hasActiveLink(accountLinks)}
            openDropdown={openDropdown}
            toggleDropdown={toggleDropdown}
            closeMenus={closeMenus}
            isActive={isActive}
            unreadCount={unreadCount}
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

          <Link
            to="/inbox"
            onClick={closeMenus}
            className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              pathname.startsWith("/inbox")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
            title="Inbox"
          >
            <Bell className="w-4 h-4" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center px-1 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile burger */}
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800/60 bg-[#050810]/95 backdrop-blur-sm">
          <div className="px-4 py-4 space-y-5">
            <MobileSection title="Suivi">
              {trackingLinks.map((item) => (
                <MobileLink
                  key={item.to}
                  item={item}
                  active={isActive(item.to)}
                  onClick={closeMenus}
                />
              ))}
            </MobileSection>

            <MobileSection title="Communauté">
              {communityLinks.map((item) => (
                <MobileLink
                  key={item.to}
                  item={item}
                  active={isActive(item.to)}
                  onClick={closeMenus}
                />
              ))}
            </MobileSection>

            <MobileSection title="Compte">
              {accountLinks.map((item) => (
                <MobileLink
                  key={item.to}
                  item={item}
                  active={isActive(item.to)}
                  onClick={closeMenus}
                  unreadCount={item.to === "/inbox" ? unreadCount : undefined}
                />
              ))}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </MobileSection>
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
            {items.map(({ to, label, icon: Icon }) => {
              const itemActive = isActive(to);
              const showBadge = to === "/inbox" && unreadCount && unreadCount > 0;

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenus}
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

type MobileSectionProps = {
  title: string;
  children: React.ReactNode;
};

function MobileSection({ title, children }: MobileSectionProps) {
  return (
    <section>
      <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
        {title}
      </p>

      <div className="space-y-1">
        {children}
      </div>
    </section>
  );
}

type MobileLinkProps = {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  unreadCount?: number;
};

function MobileLink({ item, active, onClick, unreadCount }: MobileLinkProps) {
  const Icon = item.icon;
  const showBadge = typeof unreadCount === "number" && unreadCount > 0;

  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:text-white hover:bg-slate-800/70"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{item.label}</span>

      {showBadge && (
        <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center px-1 leading-none">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}