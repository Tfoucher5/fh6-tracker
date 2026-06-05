import { Target, Users, Clock, CheckCircle2, ChevronRight, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import type { Challenge } from "./useChallenges";

function timeLeft(endStr: string): string {
  const diff = new Date(endStr).getTime() - Date.now();
  if (diff <= 0) return "Terminé";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}j ${hours}h restants`;
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}min restants`;
  return `${mins} min restants`;
}

type Props = {
  challenge: Challenge;
  isParticipating?: boolean;
};

export function ChallengeCard({ challenge, isParticipating }: Props) {
  const remaining = timeLeft(challenge.ends_at);
  const isOver = remaining === "Terminé";
  const car = challenge.car;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-500/20">
      {/* Car background image */}
      {car?.image_url ? (
        <div className="absolute inset-0">
          <img src={car.image_url} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-slate-900/60 to-slate-900/80" />
      )}

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

      <div className="relative px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Label */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-red-400" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-400">
                Défi de la semaine
              </span>
            </div>

            {/* Car name */}
            {car && (
              <h3 className="font-heading font-black text-2xl uppercase tracking-wide text-white leading-tight mb-0.5">
                {car.make} {car.model}
              </h3>
            )}
            {!car && (
              <h3 className="font-heading font-black text-xl uppercase tracking-wide text-white leading-tight mb-1">
                {challenge.title}
              </h3>
            )}

            {challenge.description && (
              <p className="text-sm text-slate-400 leading-relaxed mb-1">{challenge.description}</p>
            )}

            {/* Instruction */}
            {!isOver && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Camera className="w-3.5 h-3.5" />
                Poste une photo de cette voiture pour participer
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {challenge.participant_count ?? 0} photo{(challenge.participant_count ?? 0) !== 1 ? "s" : ""} soumise{(challenge.participant_count ?? 0) !== 1 ? "s" : ""}
              </span>
              <span className={`flex items-center gap-1.5 ${isOver ? "text-slate-600" : "text-slate-400"}`}>
                <Clock className="w-3.5 h-3.5" />
                {remaining}
              </span>
              {isParticipating && (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Participé !
                </span>
              )}
            </div>
          </div>

          {/* Link to challenge page */}
          <Link
            to={`/challenge/${challenge.id}`}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-red-600/15 border border-red-500/25 hover:bg-red-600/25 text-red-400 px-3 py-2.5 text-sm font-bold transition-colors"
          >
            Voir
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
