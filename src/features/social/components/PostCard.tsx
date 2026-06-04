import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Trash2, Car, Bookmark } from "lucide-react";
import type { FeedPost } from "../types";
import { UserAvatar } from "./UserAvatar";
import { FeedComments } from "./FeedComments";
import { ClassBadge } from "../../../components/ClassBadge";
import { LightboxTrigger, PostLightbox } from "./PostLightbox";

type PostCardProps = {
  post: FeedPost;
  currentUserId: string | null;
  isSaved?: boolean;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onSave?: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
};

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export function PostCard({ post, currentUserId, isSaved = false, onLike, onDelete, onSave, onCommentAdded }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const liked = post.post_likes.some((l) => l.user_id === currentUserId);
  const likeCount = post.post_likes.length;
  const commentCount = post.post_comments.length;
  const isOwner = post.user_id === currentUserId;
  const imageUrl = post.photo_url ?? post.car?.image_url;

  return (
    <article className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <UserAvatar
          username={post.profile.username}
          displayName={post.profile.display_name}
          avatarUrl={post.profile.avatar_url}
          size="sm"
          linkToProfile
        />
        <div className="flex-1 min-w-0">
          <Link to={`/u/${post.profile.username}`} className="text-sm font-bold text-white hover:text-red-400 transition-colors">
            {post.profile.display_name ?? post.profile.username}
          </Link>
          <p className="text-[11px] text-slate-600 font-mono">{relativeDate(post.created_at)}</p>
        </div>
        {post.car && (
          <Link to={`/cars/${post.car.id}`} className="shrink-0">
            <ClassBadge carClass={post.car.car_class ?? "?"} pi={post.car.pi} size="sm" />
          </Link>
        )}
        {isOwner && (
          confirmDelete ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-slate-400">Supprimer ?</span>
              <button
                onClick={() => { onDelete(post.id); setConfirmDelete(false); }}
                className="rounded-lg bg-red-600 hover:bg-red-500 px-2 py-0.5 text-xs font-bold text-white transition-colors"
              >
                Oui
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-300 transition-colors"
              >
                Non
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-slate-700 hover:text-red-500 transition-colors shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Photo */}
      {imageUrl ? (
        <LightboxTrigger src={imageUrl} alt={post.car ? `${post.car.make} ${post.car.model}` : "Post"} onOpen={setLightbox}>
          <img
            src={imageUrl}
            alt={post.car ? `${post.car.make} ${post.car.model}` : "Post"}
            loading="lazy"
            decoding="async"
            className="w-full aspect-video object-cover"
          />
        </LightboxTrigger>
      ) : (
        <div className="w-full aspect-video bg-slate-950/60 flex items-center justify-center">
          <Car className="w-12 h-12 text-slate-700" />
        </div>
      )}

      {/* Body */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        {post.car && (
          <Link to={`/cars/${post.car.id}`} className="flex items-center gap-2 group">
            <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors font-mono">
              {post.car.year} · {post.car.make} {post.car.model}
            </span>
          </Link>
        )}

        {post.caption && <p className="text-sm text-slate-200 leading-relaxed">{post.caption}</p>}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
            disabled={!currentUserId}
            className={`flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
              liked ? "text-red-500" : "text-slate-500 hover:text-red-400"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-red-500" : ""}`} />
            <span className="text-xs font-mono">{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-mono">{commentCount}</span>
          </button>

          {currentUserId && onSave && (
            <button
              onClick={() => onSave(post.id)}
              className={`ml-auto flex items-center gap-1.5 transition-colors ${
                isSaved ? "text-amber-400" : "text-slate-500 hover:text-amber-400"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-amber-400" : ""}`} />
            </button>
          )}
        </div>

        {showComments && (
          <FeedComments
            postId={post.id}
            currentUserId={currentUserId}
            onCommentAdded={() => onCommentAdded(post.id)}
          />
        )}
      </div>

      {lightbox && <PostLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </article>
  );
}
