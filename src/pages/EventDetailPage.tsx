import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Users, CalendarDays, Loader2, CheckCircle2 } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { ParticipantList } from "../features/events/components/ParticipantList";
import { UserAvatar } from "../features/social/components/UserAvatar";
import { useEventDetail } from "../features/events/hooks/useEventDetail";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, event, loading, isParticipating, saving, toggleParticipation } = useEventDetail(id);

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

          {/* Participants */}
          <ParticipantList
            participants={event.event_participants}
            maxParticipants={event.max_participants}
          />
        </div>
      </div>
    </PageLayout>
  );
}
