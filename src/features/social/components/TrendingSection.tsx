import { Link } from "react-router-dom";
import { Flame, Heart, MessageCircle } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { useTrending } from "../hooks/useTrending";
import type { FeedPost } from "../types";

function TrendingCard({ post, rank }: { post: FeedPost; rank: number }) {
  const rankColors = ["text-amber-400", "text-slate-300", "text-orange-400"];
  const rankLabels = ["#1", "#2", "#3"];

  return (
    <Link
      to={`/u/${post.profile.username}`}
      className="relative flex-shrink-0 w-40 sm:w-44 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/60 hover:border-slate-700 transition-colors group"
    >
      {/* Photo ou placeholder */}
      <div className="relative h-28 bg-slate-800">
        {post.photo_url ? (
          <img
            src={post.photo_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <span className="font-heading font-black text-4xl text-slate-700">{rankLabels[rank]}</span>
          </div>
        )}
        {/* Rang */}
        <span className={`absolute top-2 left-2 font-heading font-black text-sm ${rankColors[rank]} drop-shadow-md`}>
          {rankLabels[rank]}
        </span>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      {/* Infos */}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <UserAvatar
            username={post.profile.username}
            displayName={post.profile.display_name}
            avatarUrl={post.profile.avatar_url}
            size="xs"
          />
          <span className="text-[11px] font-bold text-white truncate">
            {post.profile.display_name ?? post.profile.username}
          </span>
        </div>
        {post.caption && (
          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-1.5">{post.caption}</p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-400 fill-red-400" />
            {post.post_likes.length}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {post.post_comments.length}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TrendingSection() {
  const { posts, loading } = useTrending();

  if (loading || posts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
        <h2 className="font-heading font-bold text-sm uppercase tracking-[0.2em] text-slate-400">
          Trending · 48h
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {posts.map((post, i) => (
          <TrendingCard key={post.id} post={post} rank={i} />
        ))}
      </div>
    </div>
  );
}
