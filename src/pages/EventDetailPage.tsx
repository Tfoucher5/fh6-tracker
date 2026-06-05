import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Users, CalendarDays, Loader2, CheckCircle2, Flag, EyeOff, ShieldCheck, RotateCcw, Trophy, Medal } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { ParticipantList } from "../features/events/components/ParticipantList";
import { UserAvatar } from "../features/social/components/UserAvatar";
import { useEventDetail } from "../features/events/hooks/useEventDetail";
import { ReportModal } from "../features/social/components/ReportModal";
import { useAdminRole } from "../hooks/useAdminRole";
import { supabase } from "../lib/supabase";

type PodiumEntry = { user_id: string; profile: { username: string; display_name: string | null; avatar_url: string | null } };

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, event, loading, isParticipating, saving, toggleParticipation } = useEventDetail(id);
  const [showReport, setShowReport] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminHidden, setAdminHidden] = useState(false);
  const adminRole = useAdminRole();
  const isAdmin = adminRole !== null;

  const [podium, setPodium] = useState<{ 1: PodiumEntry | null; 2: PodiumEntry | null; 3: PodiumEntry | null }>({ 1: null, 2: null, 3: null });
  const [podiumDraft, setPodiumDraft] = useState<{ 1: string; 2: string; 3: string }>({ 1: "", 2: "", 3: "" });
  const [podiumSaving, setPodiumSaving] = useState(false);

  useEffect(() => {
    if (event) {
      document.title = `${event.title} — FH6 Tracker`;
      loadPodium(event.id);
    } else {
      document.title = "Événement — FH6 Tracker";
    }
  }, [event?.id]);

  async function loadPodium(eventId: string) {
    const { data } = await supabase
      .from("event_results")
      .select("position, user_id, profile:profiles!event_results_user_id_fkey(username, display_name, avatar_url)")
      .eq("event_id", eventId);
    if (!data) return;
    const map: typeof podium = { 1: null, 2: null, 3: null };
    for (const raw of data as unknown as Array<{ position: 1 | 2 | 3; user_id: string; profile: PodiumEntry["profile"] | PodiumEntry["profile"][] }>) {
      const profile = Array.isArray(raw.profile) ? raw.profile[0] : raw.profile;
      if (profile) map[raw.position] = { user_id: raw.user_id, profile };
    }
    setPodium(map);
    setPodiumDraft({ 1: map[1]?.user_id ?? "", 2: map[2]?.user_id ?? "", 3: map[3]?.user_id ?? "" });
  }

  async function savePodium() {
    if (!event) return;
    setPodiumSaving(true);
    await supabase.from("event_results").delete().eq("event_id", event.id);
    const inserts = ([1, 2, 3] as const)
      .filter((pos) => podiumDraft[pos])
      .map((pos) => ({ event_id: event.id, user_id: podiumDraft[pos], position: pos }));
    if (inserts.length > 0) {
      await supabase.from("event_results").insert(inserts);
      for (const row of inserts) {
        await supabase.rpc("check_and_grant_badges", { p_user_id: row.user_id });
      }
    }
    await loadPodium(event.id);
    setPodiumSaving(false);
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

  if (!event) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-500">
            Événement introuvable
          </p>
          <Link to="/events" className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Retour aux événements
          </Link>
        </div>
      </PageLayout>
    );
  }

  const past = new Date(event.event_date).getTime() < Date.now();
  const full = event.max_participants != null && event.event_participants.length >= event.max_participants;
  const formattedDate = new Date(event.event_date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = new Date(event.event_date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back */}
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Événements
          </Link>

          {/* Hero card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
            {event.cover_image_url && (
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full aspect-video object-cover"
              />
            )}

            <div className="p-6 space-y-5">
              {past && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700/60 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Terminé
                </span>
              )}

              <h1 className="font-heading font-black text-4xl uppercase tracking-wide text-white leading-tight">
                {event.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CalendarDays className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    {formattedDate} à {formattedTime}
                  </span>
                </div>
                {event.location_in_game && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{event.location_in_game}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-mono">
                    {event.event_participants.length}
                    {event.max_participants ? ` / ${event.max_participants} participants` : " participants"}
                  </span>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-center gap-3 pt-1">
                <UserAvatar
                  username={event.profile.username}
                  displayName={event.profile.display_name}
                  avatarUrl={event.profile.avatar_url}
                  size="sm"
                  linkToProfile
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Organisateur</p>
                  <Link
                    to={`/u/${event.profile.username}`}
                    className="text-sm font-bold text-white hover:text-red-400 transition-colors"
                  >
                    {event.profile.display_name ?? event.profile.username}
                  </Link>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap border-t border-slate-800/60 pt-5">
                  {event.description}
                </p>
              )}

              {/* Admin bar */}
              {isAdmin && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600/70" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/60 flex-1">Staff</span>
                  {adminHidden ? (
                    <button
                      disabled={adminActionLoading}
                      onClick={async () => {
                        setAdminActionLoading(true);
                        const { error } = await supabase.rpc("admin_restore_event", { p_event_id: event.id });
                        if (!error) setAdminHidden(false);
                        else { console.error("admin_restore_event:", error.message); alert(`Erreur : ${error.message}`); }
                        setAdminActionLoading(false);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/15 transition-colors disabled:opacity-40"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restaurer
                    </button>
                  ) : (
                    <button
                      disabled={adminActionLoading}
                      onClick={async () => {
                        setAdminActionLoading(true);
                        const { error } = await supabase.rpc("admin_hide_event", { p_event_id: event.id });
                        if (!error) setAdminHidden(true);
                        else { console.error("admin_hide_event:", error.message); alert(`Erreur : ${error.message}`); }
                        setAdminActionLoading(false);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-amber-400 border border-amber-500/25 hover:bg-amber-500/15 transition-colors disabled:opacity-40"
                    >
                      <EyeOff className="w-3 h-3" />
                      Masquer
                    </button>
                  )}
                </div>
              )}

              {/* Report */}
              {user && user.id !== event.creator_id && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowReport(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-500 transition-colors"
                    title="Signaler cet événement"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Signaler l'événement
                  </button>
                </div>
              )}

              {/* Join/Leave */}
              {user && !past && (
                <div className="pt-2">
                  {isParticipating ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Tu es inscrit à cet événement
                      </div>
                      <button
                        onClick={toggleParticipation}
                        disabled={saving}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 px-5 py-2.5 text-sm font-bold text-slate-400 transition-colors flex items-center gap-2"
                      >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Se désinscrire
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={toggleParticipation}
                      disabled={saving || full}
                      className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {full ? "Complet" : "Rejoindre l'événement"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {showReport && event && (
            <ReportModal targetType="event" targetId={event.id} onClose={() => setShowReport(false)} />
          )}

          {/* Participants */}
          <ParticipantList
            participants={event.event_participants}
            maxParticipants={event.max_participants}
          />

          {/* ── Podium public ── */}
          {past && (podium[1] || podium[2] || podium[3]) && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-white">Podium</h3>
              </div>
              <div className="flex items-end justify-center gap-3">
                {/* 2ème */}
                <PodiumSlot rank={2} entry={podium[2]} />
                {/* 1er */}
                <PodiumSlot rank={1} entry={podium[1]} />
                {/* 3ème */}
                <PodiumSlot rank={3} entry={podium[3]} />
              </div>
            </div>
          )}

          {/* ── Admin : enregistrer les résultats ── */}
          {isAdmin && past && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600/70" />
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-amber-700/70">Résultats (admin)</h3>
              </div>
              {([1, 2, 3] as const).map((pos) => {
                const icons = { 1: <Trophy className="w-4 h-4 text-amber-400" />, 2: <Medal className="w-4 h-4 text-slate-400" />, 3: <Medal className="w-4 h-4 text-orange-600" /> };
                const labels = { 1: "1ère place", 2: "2ème place", 3: "3ème place" };
                return (
                  <div key={pos} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-28 shrink-0">
                      {icons[pos]}
                      <span className="text-xs font-semibold text-slate-400">{labels[pos]}</span>
                    </div>
                    <select
                      value={podiumDraft[pos]}
                      onChange={(e) => setPodiumDraft((d) => ({ ...d, [pos]: e.target.value }))}
                      className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700/60 px-3 py-2 text-sm outline-none focus:border-amber-500/50 transition-colors"
                    >
                      <option value="">— Aucun —</option>
                      {(event.event_participants as Array<{ user_id: string; profile: { username: string; display_name: string | null } }>).map((p) => (
                        <option key={p.user_id} value={p.user_id}>
                          {p.profile.display_name ?? p.profile.username} (@{p.profile.username})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
              <div className="flex justify-end">
                <button
                  onClick={savePodium}
                  disabled={podiumSaving}
                  className="flex items-center gap-2 rounded-xl bg-amber-600/80 hover:bg-amber-500/80 disabled:opacity-50 px-4 py-2 text-sm font-bold transition-colors"
                >
                  {podiumSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                  {podiumSaving ? "Enregistrement…" : "Enregistrer le podium"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function PodiumSlot({ rank, entry }: { rank: 1 | 2 | 3; entry: PodiumEntry | null }) {
  const heights = { 1: "h-20", 2: "h-14", 3: "h-10" };
  const colors  = { 1: "bg-amber-500/20 border-amber-500/40 text-amber-400", 2: "bg-slate-400/15 border-slate-400/30 text-slate-300", 3: "bg-orange-600/15 border-orange-600/30 text-orange-500" };
  const labels  = { 1: "1er", 2: "2ème", 3: "3ème" };

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      {entry ? (
        <Link to={`/u/${entry.profile.username}`} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
          <UserAvatar username={entry.profile.username} displayName={entry.profile.display_name} avatarUrl={entry.profile.avatar_url} size="sm" />
          <p className="text-xs font-semibold text-white text-center truncate max-w-[80px]">{entry.profile.display_name ?? entry.profile.username}</p>
        </Link>
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/40" />
      )}
      <div className={`w-full ${heights[rank]} border rounded-t-lg flex items-center justify-center font-heading font-black text-sm ${colors[rank]}`}>
        {labels[rank]}
      </div>
    </div>
  );
}
