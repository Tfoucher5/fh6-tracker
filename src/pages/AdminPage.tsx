import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, ShieldCheck, Users, ArrowLeft, ChevronDown, ChevronUp,
  CheckCircle2, Ban, PauseCircle, AlertTriangle,
} from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { UserAvatar } from "../features/social/components/UserAvatar";
import { supabase } from "../lib/supabase";

type AdminUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  account_status: string;
  role: string;
  current_streak: number;
  joined_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active:     { label: "Actif",       className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", icon: <CheckCircle2 className="w-3 h-3" /> },
  warned:     { label: "Averti",      className: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",   icon: <AlertTriangle className="w-3 h-3" /> },
  restricted: { label: "Restreint",   className: "bg-orange-500/15 text-orange-300 border-orange-500/25",   icon: <AlertTriangle className="w-3 h-3" /> },
  suspended:  { label: "Suspendu",    className: "bg-amber-500/15 text-amber-300 border-amber-500/25",      icon: <PauseCircle className="w-3 h-3" /> },
  banned:     { label: "Banni",       className: "bg-red-500/15 text-red-300 border-red-500/25",            icon: <Ban className="w-3 h-3" /> },
};

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  user:       { label: "User",       className: "bg-slate-800 text-slate-400 border-slate-700" },
  moderator:  { label: "Modo",       className: "bg-blue-500/15 text-blue-300 border-blue-500/25" },
  admin:      { label: "Admin",      className: "bg-red-500/15 text-red-300 border-red-500/25" },
  owner:      { label: "Owner",      className: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
};

export default function AdminPage() {
  const [myRole, setMyRole] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmBan, setConfirmBan] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: roleData } = await supabase.rpc("get_my_role");
    setMyRole(roleData ?? "user");

    if (!["admin", "owner"].includes(roleData ?? "")) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.rpc("admin_list_users", {
      search_query: "",
      limit_n: 50,
      offset_n: 0,
    });
    setUsers((data ?? []) as AdminUser[]);
    setLoading(false);
  }

  async function doSearch(q: string) {
    setSearch(q);
    if (!["admin", "owner"].includes(myRole ?? "")) return;
    const { data } = await supabase.rpc("admin_list_users", {
      search_query: q,
      limit_n: 50,
      offset_n: 0,
    });
    setUsers((data ?? []) as AdminUser[]);
  }

  async function setStatus(userId: string, status: string) {
    if (status === "banned" && confirmBan !== userId) {
      setConfirmBan(userId);
      return;
    }
    setActionLoading(true);
    setConfirmBan(null);
    const { error } = await supabase.rpc("admin_set_account_status", {
      p_user_id: userId,
      p_status: status,
    });
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, account_status: status } : u))
      );
    }
    setActionLoading(false);
  }

  async function setRole(userId: string, role: string) {
    setActionLoading(true);
    const { error } = await supabase.rpc("admin_set_user_role", {
      p_user_id: userId,
      p_role: role,
    });
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-400 animate-pulse">
            Chargement…
          </p>
        </div>
      </PageLayout>
    );
  }

  if (!["admin", "owner"].includes(myRole ?? "")) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <ShieldCheck className="w-12 h-12 text-slate-700" />
          <p className="font-heading font-bold text-xl uppercase text-slate-500">Accès refusé</p>
          <Link to="/" className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Retour au dashboard
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">
                  Administration
                </p>
                <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none flex items-center gap-3">
                  <ShieldCheck className="w-10 h-10 text-red-400" />
                  Admin
                </h1>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-mono text-slate-400">{users.length} utilisateur(s)</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par pseudo ou nom…"
              value={search}
              onChange={(e) => doSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600"
            />
          </div>

          {/* User list */}
          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <Users className="w-10 h-10 mx-auto mb-3" />
                <p className="font-heading font-bold uppercase">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              users.map((u) => {
                const statusCfg = STATUS_CONFIG[u.account_status] ?? STATUS_CONFIG.active;
                const roleCfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.user;
                const isExpanded = expandedId === u.id;
                const isBanConfirm = confirmBan === u.id;

                return (
                  <div
                    key={u.id}
                    className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden"
                  >
                    {/* Row */}
                    <button
                      onClick={() => {
                        setExpandedId(isExpanded ? null : u.id);
                        setConfirmBan(null);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800/30 transition-colors text-left"
                    >
                      <UserAvatar
                        username={u.username}
                        displayName={u.display_name}
                        avatarUrl={u.avatar_url}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {u.display_name ?? u.username}
                        </p>
                        <p className="text-xs font-mono text-slate-500">@{u.username}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleCfg.className}`}>
                          {roleCfg.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.className}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {/* Action panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-800/60 px-4 py-4 space-y-4 bg-slate-950/40">
                        <div className="flex gap-4 text-xs text-slate-500 font-mono">
                          <span>Streak : {u.current_streak}j</span>
                          <span>Inscrit : {new Date(u.joined_at).toLocaleDateString("fr-FR")}</span>
                          <Link to={`/u/${u.username}`} className="text-red-400 hover:text-red-300 transition-colors">
                            Voir le profil →
                          </Link>
                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                            Statut du compte
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(["active", "warned", "restricted", "suspended", "banned"] as const).map((s) => {
                              const cfg = STATUS_CONFIG[s];
                              const isCurrent = u.account_status === s;
                              const isBanBtn = s === "banned";
                              return (
                                <button
                                  key={s}
                                  disabled={isCurrent || actionLoading || u.role === "owner"}
                                  onClick={() => setStatus(u.id, s)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isCurrent
                                      ? cfg.className + " ring-1 ring-white/20"
                                      : isBanBtn && isBanConfirm
                                      ? "bg-red-600 text-white border-red-500 animate-pulse"
                                      : "bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                                  }`}
                                >
                                  {cfg.icon}
                                  {isBanBtn && isBanConfirm ? "Confirmer le ban" : cfg.label}
                                </button>
                              );
                            })}
                          </div>
                          {isBanConfirm && (
                            <p className="text-xs text-red-400 mt-2">
                              Clique à nouveau sur "Confirmer le ban" pour bannir définitivement cet utilisateur.
                              <button
                                onClick={() => setConfirmBan(null)}
                                className="ml-2 text-slate-500 hover:text-white"
                              >
                                Annuler
                              </button>
                            </p>
                          )}
                        </div>

                        {/* Role — owner only for admin promotion */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                            Rôle
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(["user", "moderator", "admin", "owner"] as const)
                              .filter((r) => {
                                if (r === "owner" && myRole !== "owner") return false;
                                if (r === "admin" && myRole !== "owner") return false;
                                return true;
                              })
                              .map((r) => {
                                const cfg = ROLE_CONFIG[r];
                                const isCurrent = u.role === r;
                                return (
                                  <button
                                    key={r}
                                    disabled={isCurrent || actionLoading || u.role === "owner"}
                                    onClick={() => setRole(u.id, r)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                      isCurrent
                                        ? cfg.className + " ring-1 ring-white/20"
                                        : "bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                                    }`}
                                  >
                                    {cfg.label}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
