import { Link } from "react-router-dom";
import { MapPin, Users, CheckCircle2 } from "lucide-react";
import type { FHEvent } from "../types";
import { UserAvatar } from "../../social/components/UserAvatar";

type EventCardProps = {
  event: FHEvent;
  isParticipating: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  currentUserId: string | null;
};

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr);
  return {
    day: date.toLocaleDateString("fr-FR", { day: "2-digit" }),
    month: date.toLocaleDateString("fr-FR", { month: "short" }),
    time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    full: date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
}

function isPast(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now();
}

export function EventCard({ event, isParticipating, onJoin, onLeave, currentUserId }: EventCardProps) {
  const date = formatEventDate(event.event_date);
  const past = isPast(event.event_date);
  const participantCount = event.event_participants.length;
  const full = event.max_participants != null && participantCount >= event.max_participants;

  return (
    <Link
      to={`/events/${event.id}`}
      className="block bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors group"
    >
      <div className="flex gap-4 p-5">
        {/* Date block */}
        <div className={`flex flex-col items-center justify-center w-14 shrink-0 rounded-xl border ${
          past ? "bg-slate-800/50 border-slate-700/50" : "bg-red-600/15 border-red-500/30"
        } py-3`}>
          <span className={`font-heading font-black text-2xl leading-none ${past ? "text-slate-500" : "text-white"}`}>
            {date.day}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${past ? "text-slate-600" : "text-red-400"}`}>
            {date.month}
          </span>
          <span className={`text-[9px] font-mono mt-1 ${past ? "text-slate-600" : "text-slate-400"}`}>
            {date.time}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2">
            <h3 className="font-heading font-bold text-lg uppercase tracking-wide text-white leading-tight flex-1 truncate">
              {event.title}
            </h3>
            {isParticipating && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
          </div>

          {event.location_in_game && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              {event.location_in_game}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserAvatar
                username={event.profile.username}
                displayName={event.profile.display_name}
                avatarUrl={event.profile.avatar_url}
                size="xs"
              />
              <span className="text-xs text-slate-500">
                {event.profile.display_name ?? event.profile.username}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="w-3.5 h-3.5" />
              <span className="font-mono">
                {participantCount}
                {event.max_participants ? `/${event.max_participants}` : ""}
              </span>
              {full && <span className="text-amber-400 text-[10px] font-bold">COMPLET</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Join/Leave button */}
      {currentUserId && !past && (
        <div
          className="border-t border-slate-800/60 px-5 py-3"
          onClick={(e) => e.preventDefault()}
        >
          {isParticipating ? (
            <button
              onClick={(e) => { e.preventDefault(); onLeave?.(); }}
              className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-400 transition-colors"
            >
              Se désinscrire
            </button>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); onJoin?.(); }}
              disabled={full}
              className="w-full rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-xs font-bold text-white transition-colors"
            >
              {full ? "Complet" : "Rejoindre"}
            </button>
          )}
        </div>
      )}
    </Link>
  );
}
