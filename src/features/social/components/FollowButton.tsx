import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useFollows } from "../hooks/useFollows";

type FollowButtonProps = {
  targetUserId: string;
};

export function FollowButton({ targetUserId }: FollowButtonProps) {
  const { currentUserId, isFollowing, loading, initialized, toggleFollow } = useFollows(targetUserId);

  if (!initialized || currentUserId === targetUserId || !currentUserId) return null;

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${
        isFollowing
          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          : "bg-red-600 hover:bg-red-500 text-white"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isFollowing ? "Abonné" : "Suivre"}
    </button>
  );
}
