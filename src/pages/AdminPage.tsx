import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, ShieldCheck, Users, ArrowLeft, ChevronDown, ChevronUp,
  CheckCircle2, Ban, PauseCircle, AlertTriangle, Flag, EyeOff,
  RotateCcw, CheckCheck, XCircle, ImageIcon, X, Target, RefreshCw, Database,
} from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { UserAvatar } from "../features/social/components/UserAvatar";
import { supabase } from "../lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

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

type AdminReport = {
  id: string;
  reporter_id: string;
  reporter_username: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  target_preview: string | null;
  target_author_username: string | null;
  target_image_url: string | null;
};

type HiddenContent = {
  content_type: string;
  content_id: string;
  author_username: string;
  preview: string | null;
  hidden_at: string;
  hidden_reason: string | null;
  image_url: string | null;
};

// ── Lightbox simple ───────────────────────────────────────────────────────────

function AdminImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={src}
        alt="Aperçu"
        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active:     { label: "Actif",     className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", icon: <CheckCircle2 className="w-3 h-3" /> },
  warned:     { label: "Averti",    className: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",   icon: <AlertTriangle className="w-3 h-3" /> },
  restricted: { label: "Restreint", className: "bg-orange-500/15 text-orange-300 border-orange-500/25",   icon: <AlertTriangle className="w-3 h-3" /> },
  suspended:  { label: "Suspendu",  className: "bg-amber-500/15 text-amber-300 border-amber-500/25",      icon: <PauseCircle className="w-3 h-3" /> },
  banned:     { label: "Banni",     className: "bg-red-500/15 text-red-300 border-red-500/25",            icon: <Ban className="w-3 h-3" /> },
};

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  user:      { label: "User",  className: "bg-slate-800 text-slate-400 border-slate-700" },
  moderator: { label: "Modo",  className: "bg-blue-500/15 text-blue-300 border-blue-500/25" },
  admin:     { label: "Admin", className: "bg-red-500/15 text-red-300 border-red-500/25" },
  owner:     { label: "Owner", className: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
};

const REASON_LABELS: Record<string, string> = {
  spam:                  "Spam",
  harassment:            "Harcèlement",
  offensive_content:     "Contenu offensant",
  inappropriate_content: "Contenu inapproprié",
  cheating:              "Triche",
  fake_event:            "Événement fictif",
  impersonation:         "Usurpation",
  other:                 "Autre",
};

// ── Onglet Utilisateurs ───────────────────────────────────────────────────────

function UsersTab({ myRole }: { myRole: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmBan, setConfirmBan] = useState<string | null>(null);

  useEffect(() => { loadUsers(""); }, []);

  async function loadUsers(q: string) {
    setLoading(true);
    const { data } = await supabase.rpc("admin_list_users", {
      search_query: q, limit_n: 50, offset_n: 0,
    });
    setUsers((data ?? []) as AdminUser[]);
    setLoading(false);
  }

  async function doSearch(q: string) {
    setSearch(q);
    await loadUsers(q);
  }

  async function setStatus(userId: string, status: string) {
    if (status === "banned" && confirmBan !== userId) { setConfirmBan(userId); return; }
    setActionLoading(true);
    setConfirmBan(null);
    const { error } = await supabase.rpc("admin_set_account_status", { p_user_id: userId, p_status: status });
    if (!error) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, account_status: status } : u));
    setActionLoading(false);
  }

  async function setRole(userId: string, role: string) {
    setActionLoading(true);
    const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
    if (!error) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    setActionLoading(false);
  }

  if (loading) return <p className="text-slate-500 text-sm py-8 text-center animate-pulse">Chargement…</p>;

  return (
    <div className="space-y-4">
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

      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <Users className="w-10 h-10 mx-auto mb-3" />
            <p className="font-heading font-bold uppercase">Aucun utilisateur trouvé</p>
          </div>
        ) : users.map((u) => {
          const statusCfg = STATUS_CONFIG[u.account_status] ?? STATUS_CONFIG.active;
          const roleCfg   = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.user;
          const isExpanded  = expandedId === u.id;
          const isBanConfirm = confirmBan === u.id;

          return (
            <div key={u.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
              <button
                onClick={() => { setExpandedId(isExpanded ? null : u.id); setConfirmBan(null); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800/30 transition-colors text-left"
              >
                <UserAvatar username={u.username} displayName={u.display_name} avatarUrl={u.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.display_name ?? u.username}</p>
                  <p className="text-xs font-mono text-slate-500">@{u.username}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleCfg.className}`}>{roleCfg.label}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.className}`}>
                    {statusCfg.icon}{statusCfg.label}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800/60 px-4 py-4 space-y-4 bg-slate-950/40">
                  <div className="flex gap-4 text-xs text-slate-500 font-mono">
                    <span>Streak : {u.current_streak}j</span>
                    <span>Inscrit : {new Date(u.joined_at).toLocaleDateString("fr-FR")}</span>
                    <Link to={`/u/${u.username}`} className="text-red-400 hover:text-red-300 transition-colors">Voir le profil →</Link>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Statut du compte</p>
                    <div className="flex flex-wrap gap-2">
                      {(["active", "warned", "restricted", "suspended", "banned"] as const).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const isCurrent = u.account_status === s;
                        return (
                          <button
                            key={s}
                            disabled={isCurrent || actionLoading || u.role === "owner"}
                            onClick={() => setStatus(u.id, s)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              isCurrent
                                ? cfg.className + " ring-1 ring-white/20"
                                : s === "banned" && isBanConfirm
                                ? "bg-red-600 text-white border-red-500 animate-pulse"
                                : "bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                            }`}
                          >
                            {cfg.icon}
                            {s === "banned" && isBanConfirm ? "Confirmer le ban" : cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    {isBanConfirm && (
                      <p className="text-xs text-red-400 mt-2">
                        Clique à nouveau pour confirmer.
                        <button onClick={() => setConfirmBan(null)} className="ml-2 text-slate-500 hover:text-white">Annuler</button>
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Rôle</p>
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
        })}
      </div>
    </div>
  );
}

// ── Onglet Modération ─────────────────────────────────────────────────────────

function ModerationTab() {
  const [subTab, setSubTab] = useState<"reports" | "hidden">("reports");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [hidden, setHidden] = useState<HiddenContent[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingHidden, setLoadingHidden] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadReports(); loadHidden(); }, []);

  async function loadReports() {
    setLoadingReports(true);
    const { data } = await supabase.rpc("admin_list_reports", { p_status: "open", p_limit: 50, p_offset: 0 });
    setReports((data ?? []) as AdminReport[]);
    setLoadingReports(false);
  }

  async function loadHidden() {
    setLoadingHidden(true);
    const { data } = await supabase.rpc("admin_list_hidden_content", { p_limit: 50, p_offset: 0 });
    setHidden((data ?? []) as HiddenContent[]);
    setLoadingHidden(false);
  }

  async function resolveReport(id: string, dismiss: boolean) {
    setActionLoading(true);
    await supabase.rpc("admin_resolve_report", { p_report_id: id, p_dismiss: dismiss });
    setReports((prev) => prev.filter((r) => r.id !== id));
    setActionLoading(false);
  }

  async function hideFromReport(report: AdminReport) {
    setActionLoading(true);
    if (report.target_type === "post") {
      await supabase.rpc("admin_hide_post", { p_post_id: report.target_id, p_reason: report.reason });
    } else if (report.target_type === "comment") {
      await supabase.rpc("admin_hide_comment", { p_comment_id: report.target_id, p_reason: report.reason });
    } else if (report.target_type === "event") {
      await supabase.rpc("admin_hide_event", { p_event_id: report.target_id, p_reason: report.reason });
    }
    await resolveReport(report.id, false);
    await loadHidden();
    setActionLoading(false);
  }

  // ── État lightbox ──────────────────────────────────────────────────────────
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  async function restore(item: HiddenContent) {
    setActionLoading(true);
    if (item.content_type === "post") {
      await supabase.rpc("admin_restore_post", { p_post_id: item.content_id });
    } else if (item.content_type === "comment") {
      await supabase.rpc("admin_restore_comment", { p_comment_id: item.content_id });
    } else if (item.content_type === "event") {
      await supabase.rpc("admin_restore_event", { p_event_id: item.content_id });
    }
    setHidden((prev) => prev.filter((h) => h.content_id !== item.content_id));
    setActionLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1 w-fit">
        {([
          { key: "reports", label: "Signalements", icon: <Flag className="w-3.5 h-3.5" />, count: reports.length },
          { key: "hidden",  label: "Masqués",      icon: <EyeOff className="w-3.5 h-3.5" />, count: hidden.length },
        ] as const).map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              subTab === key
                ? "bg-red-600/20 text-red-300 border border-red-500/30"
                : "text-slate-500 hover:text-white"
            }`}
          >
            {icon}{label}
            {count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                subTab === key ? "bg-red-600/30 text-red-200" : "bg-slate-800 text-slate-400"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Signalements */}
      {subTab === "reports" && (
        loadingReports ? (
          <p className="text-slate-500 text-sm py-8 text-center animate-pulse">Chargement…</p>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <Flag className="w-10 h-10 mx-auto mb-3" />
            <p className="font-heading font-bold uppercase">Aucun signalement ouvert</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => {
              const contentUrl = r.target_type === "event"
                ? `/events/${r.target_id}`
                : r.target_type === "profile" && r.target_author_username
                ? `/u/${r.target_author_username}`
                : r.target_author_username
                ? `/u/${r.target_author_username}`
                : null;

              const TYPE_LABEL: Record<string, string> = {
                post: "Post", comment: "Commentaire", event: "Événement", profile: "Profil",
              };

              return (
              <div key={r.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-3 space-y-3">
                {/* En-tête */}
                <div className="flex items-start gap-3 justify-between flex-wrap">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {TYPE_LABEL[r.target_type] ?? r.target_type}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/25">
                        {REASON_LABELS[r.reason] ?? r.reason}
                      </span>
                    </div>
                    {/* Aperçu du contenu */}
                    {r.target_preview && (
                      <p className="text-xs text-slate-300 leading-snug truncate max-w-xs">
                        {r.target_preview}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 font-mono">
                      {r.target_author_username && (
                        <>
                          <Link to={`/u/${r.target_author_username}`} className="text-slate-400 hover:text-white transition-colors">
                            @{r.target_author_username}
                          </Link>
                          {" · "}
                        </>
                      )}
                      Signalé par <Link to={`/u/${r.reporter_username}`} className="text-slate-400 hover:text-white transition-colors">@{r.reporter_username}</Link>
                      {" · "}{new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {r.details && (
                      <p className="text-xs text-slate-500 italic">« {r.details} »</p>
                    )}
                  </div>
                  {/* Boutons droite : photo + lien */}
                  <div className="shrink-0 flex flex-col gap-1.5 items-end">
                    {r.target_image_url && (
                      <button
                        onClick={() => setLightboxUrl(r.target_image_url)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 transition-colors"
                        title="Voir la photo"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Photo
                      </button>
                    )}
                    {contentUrl && (
                      <Link
                        to={contentUrl}
                        target={r.target_type === "event" ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 transition-colors"
                      >
                        Voir →
                      </Link>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={actionLoading || r.target_type === "profile"}
                    onClick={() => hideFromReport(r)}
                    title={r.target_type === "profile" ? "Passe par le panneau Utilisateurs pour agir sur un profil" : undefined}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <EyeOff className="w-3 h-3" />
                    Masquer
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => resolveReport(r.id, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Résoudre
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => resolveReport(r.id, true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40"
                  >
                    <XCircle className="w-3 h-3" />
                    Ignorer
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )
      )}

      {/* Contenus masqués */}
      {subTab === "hidden" && (
        loadingHidden ? (
          <p className="text-slate-500 text-sm py-8 text-center animate-pulse">Chargement…</p>
        ) : hidden.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <EyeOff className="w-10 h-10 mx-auto mb-3" />
            <p className="font-heading font-bold uppercase">Aucun contenu masqué</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hidden.map((h) => (
              <div key={h.content_id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
                {/* Miniature cliquable si image disponible */}
                {h.image_url && (
                  <button
                    onClick={() => setLightboxUrl(h.image_url)}
                    className="block w-full group relative overflow-hidden"
                    title="Voir la photo"
                  >
                    <img
                      src={h.image_url}
                      alt=""
                      className="w-full h-28 object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-bold">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Voir la photo
                      </div>
                    </div>
                  </button>
                )}
                <div className="px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 capitalize">
                        {h.content_type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">@{h.author_username}</span>
                    </div>
                    {h.preview && (
                      <p className="text-xs text-slate-500 truncate italic">"{h.preview}"</p>
                    )}
                    <p className="text-[10px] text-slate-600 font-mono">
                      Masqué le {new Date(h.hidden_at).toLocaleDateString("fr-FR")}
                      {h.hidden_reason && ` · ${h.hidden_reason}`}
                    </p>
                  </div>
                  <button
                    disabled={actionLoading}
                    onClick={() => restore(h)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors disabled:opacity-40"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restaurer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {lightboxUrl && (
        <AdminImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "moderation" | "challenges" | "catalogue">("users");
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => { document.title = "Administration — FH6 Tracker"; }, []);

  useEffect(() => {
    (async () => {
      const { data: roleData } = await supabase.rpc("get_my_role");
      setMyRole(roleData ?? "user");
      if (["admin", "owner", "moderator"].includes(roleData ?? "")) {
        const { data } = await supabase.rpc("admin_list_users", { search_query: "", limit_n: 1, offset_n: 0 });
        setUserCount((data as unknown[])?.length ?? null);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-400 animate-pulse">Chargement…</p>
        </div>
      </PageLayout>
    );
  }

  if (!["admin", "owner", "moderator"].includes(myRole ?? "")) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <ShieldCheck className="w-12 h-12 text-slate-700" />
          <p className="font-heading font-bold text-xl uppercase text-slate-500">Accès refusé</p>
          <Link to="/dashboard" className="text-sm text-red-400 hover:text-red-300 transition-colors">Retour au dashboard</Link>
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
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />Dashboard
            </Link>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">Administration</p>
                <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none flex items-center gap-3">
                  <ShieldCheck className="w-10 h-10 text-red-400" />Admin
                </h1>
              </div>
              {userCount !== null && (
                <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-mono text-slate-400">{userCount} utilisateur(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1 w-fit">
            {([
              { key: "users",      label: "Utilisateurs", icon: <Users className="w-3.5 h-3.5" /> },
              { key: "moderation", label: "Modération",   icon: <Flag className="w-3.5 h-3.5" /> },
              { key: "challenges", label: "Défis",        icon: <Target className="w-3.5 h-3.5" /> },
              { key: "catalogue",  label: "Catalogue",    icon: <Database className="w-3.5 h-3.5" /> },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === key
                    ? "bg-red-600/20 text-red-300 border border-red-500/30"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "users"      && <UsersTab myRole={myRole!} />}
          {activeTab === "moderation" && <ModerationTab />}
          {activeTab === "challenges" && <ChallengesTab />}
          {activeTab === "catalogue"  && <CatalogueTab />}

        </div>
      </div>
    </PageLayout>
  );
}

// ─── Onglet Défis ─────────────────────────────────────────────────────────────

type ChallengeAdminRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  leaderboard_published: boolean;
  car: { make: string; model: string; year: number; image_url: string | null } | null;
};

function ChallengesTab() {
  const [challenges, setChallenges] = useState<ChallengeAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => { loadChallenges(); }, []);

  async function loadChallenges() {
    const { data } = await supabase
      .from("challenges")
      .select("id, title, starts_at, ends_at, leaderboard_published, car:cars(make, model, year, image_url)")
      .order("starts_at", { ascending: false })
      .limit(10);
    setChallenges((data ?? []) as unknown as ChallengeAdminRow[]);
    setLoading(false);
  }

  async function triggerNow() {
    setTriggering(true);
    await supabase.rpc("auto_create_weekly_challenge");
    await loadChallenges();
    setTriggering(false);
  }

  const now = new Date();

  function challengeStatus(c: ChallengeAdminRow) {
    if (now < new Date(c.starts_at)) return "upcoming";
    if (now > new Date(c.ends_at)) return c.leaderboard_published ? "published" : "pending";
    return "active";
  }

  const statusLabel = { active: "En cours", upcoming: "À venir", pending: "En vérification", published: "Publié" };
  const statusStyle = {
    active:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    upcoming: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    pending:  "bg-red-500/15 text-red-400 border-red-500/30",
    published:"bg-slate-800/60 text-slate-500 border-slate-700/40",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white font-semibold">Défis hebdomadaires</p>
          <p className="text-xs text-slate-500 mt-0.5">Voiture aléatoire du catalogue, générée automatiquement chaque lundi à 8h.</p>
        </div>
        <button
          onClick={triggerNow}
          disabled={triggering}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white border border-slate-700/60 hover:border-slate-600 rounded-lg px-3 py-1.5 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${triggering ? "animate-spin" : ""}`} />
          Forcer génération
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 animate-pulse">Chargement…</p>
      ) : challenges.length === 0 ? (
        <p className="text-sm text-slate-600">Aucun défi. Clique sur "Forcer génération" pour en créer un.</p>
      ) : (
        <div className="space-y-2">
          {challenges.map((c) => {
            const s = challengeStatus(c);
            return (
              <Link
                key={c.id}
                to={`/challenge/${c.id}`}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/60 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors"
              >
                {c.car?.image_url && (
                  <img src={c.car.image_url} alt="" className="w-14 h-9 object-cover rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${statusStyle[s]}`}>
                      {statusLabel[s]}
                    </span>
                    <span className="text-sm text-white font-medium truncate">
                      {c.car ? `${c.car.make} ${c.car.model} (${c.car.year})` : c.title}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                    {new Date(c.starts_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    {" → "}
                    {new Date(c.ends_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                {s === "pending" && (
                  <span className="text-[10px] font-bold text-red-400 shrink-0">À vérifier →</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Onglet Catalogue ─────────────────────────────────────────────────────────

const SCRAPE_URL = "https://pnazdsjgcwwkuysxrbcd.supabase.co/functions/v1/scrape-forza-cars";
const SCRAPE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuYXpkc2pnY3d3a3V5c3hyYmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTg0MTYsImV4cCI6MjA5NjEzNDQxNn0.9p5jqLhSkPc2HQIkA0oSj_4nYKilQseMK8uci5_D8ZU";

type ScrapeRun = {
  id: string;
  status: string;
  cars_found: number | null;
  cars_inserted: number | null;
  cars_updated: number | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

function CatalogueTab() {
  const [carCount, setCarCount] = useState<number | null>(null);
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ count }, { data: runsData, error: runsError }] = await Promise.all([
      supabase.from("cars").select("*", { count: "exact", head: true }),
      supabase.from("scrape_runs").select("*").order("started_at", { ascending: false }).limit(8),
    ]);
    if (runsError) console.error("[CatalogueTab] scrape_runs error:", runsError);
    setCarCount(count ?? 0);
    setRuns((runsData ?? []) as ScrapeRun[]);
    setLoadingRuns(false);
  }

  async function runScrape() {
    setScraping(true);
    setScrapeResult(null);
    try {
      const res = await fetch(SCRAPE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SCRAPE_KEY}`,
        },
        body: "{}",
      });
      const json = await res.json();
      if (json.ok) {
        setScrapeResult(`✓ ${json.cars_found} voitures — ${json.inserted} ajoutées, ${json.updated} mises à jour`);
      } else {
        setScrapeResult(`Erreur : ${json.error}`);
      }
      await loadData();
    } catch (e) {
      setScrapeResult(`Erreur réseau : ${e instanceof Error ? e.message : String(e)}`);
    }
    setScraping(false);
  }

  const statusStyle: Record<string, string> = {
    success: "text-emerald-400",
    running: "text-amber-400 animate-pulse",
    error:   "text-red-400",
  };

  return (
    <div className="space-y-5">
      {/* Stats + bouton */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-heading font-black text-white">{carCount ?? "…"}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">voitures dans le catalogue</p>
          <p className="text-[10px] text-slate-600 mt-1">Mise à jour automatique chaque lundi à 6h00 UTC</p>
        </div>
        <button
          onClick={runScrape}
          disabled={scraping}
          className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-2.5 text-sm font-bold transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`} />
          {scraping ? "Scraping…" : "Lancer le scraper"}
        </button>
      </div>

      {scrapeResult && (
        <p className={`text-sm font-mono px-1 ${scrapeResult.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
          {scrapeResult}
        </p>
      )}

      {/* Historique des runs */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Historique</p>
        {loadingRuns ? (
          <p className="text-sm text-slate-600 animate-pulse">Chargement…</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun run enregistré.</p>
        ) : (
          runs.map((r) => (
            <div key={r.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className={`text-xs font-bold uppercase w-16 shrink-0 ${statusStyle[r.status] ?? "text-slate-500"}`}>
                {r.status}
              </span>
              <div className="flex-1 min-w-0 text-xs text-slate-500 font-mono">
                {r.status === "success" && (
                  <span>{r.cars_found} trouvées · {r.cars_inserted} ajoutées · {r.cars_updated} màj</span>
                )}
                {r.status === "error" && (
                  <span className="text-red-500 truncate">{r.error_message}</span>
                )}
                {r.status === "running" && <span>En cours…</span>}
              </div>
              <span className="text-[10px] font-mono text-slate-700 shrink-0">
                {new Date(r.started_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
