import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { UserAvatar } from "../../social/components/UserAvatar";

type Participant = {
  user_id: string;
  joined_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

type ParticipantListProps = {
  participants: Participant[];
  maxParticipants?: number | null;
};

export function ParticipantList({ participants, maxParticipants }: ParticipantListProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Users className="w-4 h-4 text-slate-500" />
        <h2 className="font-heading font-bold text-lg uppercase tracking-wide">
          Participants
        </h2>
        <span className="font-mono text-sm text-slate-500">
          {participants.length}
          {maxParticipants ? `/${maxParticipants}` : ""}
        </span>
      </div>

      {participants.length === 0 ? (
        <p className="text-sm text-slate-600">Aucun participant pour l'instant. Sois le premier !</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {participants.map((p) => (
            <Link
              key={p.user_id}
              to={`/u/${p.profile.username}`}
              className="flex items-center gap-3 bg-slate-950/40 border border-slate-800/60 rounded-xl px-4 py-3 hover:border-slate-700 transition-colors"
            >
              <UserAvatar
                username={p.profile.username}
                displayName={p.profile.display_name}
                avatarUrl={p.profile.avatar_url}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {p.profile.display_name ?? p.profile.username}
                </p>
                <p className="text-xs text-slate-600 font-mono">@{p.profile.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
