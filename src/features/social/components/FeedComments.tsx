import { useEffect, useRef, useState } from "react";
import { Send, CornerDownRight, ChevronDown, ChevronUp, Flag, Heart } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { PostComment } from "../types";
import { UserAvatar } from "./UserAvatar";
import { Link } from "react-router-dom";
import { ReportModal } from "./ReportModal";

type FeedCommentsProps = {
  postId: string;
  currentUserId: string | null;
  onCommentAdded?: () => void;
};

const COMMENT_SELECT =
  "id, post_id, user_id, content, created_at, parent_id, status, profile:profiles!post_comments_user_id_fkey(username, display_name, avatar_url), comment_likes(user_id)";

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function buildTree(flat: PostComment[]): PostComment[] {
  const map = new Map<string, PostComment>();
  const roots: PostComment[] = [];
  for (const c of flat) map.set(c.id, { ...c, replies: [] });
  for (const c of map.values()) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  }
  // Trier les commentaires racine par nombre de likes desc, puis chronologique
  roots.sort((a, b) => {
    const diff = (b.comment_likes?.length ?? 0) - (a.comment_likes?.length ?? 0);
    if (diff !== 0) return diff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  return roots;
}

type CommentRowProps = {
  comment: PostComment;
  currentUserId: string | null;
  depth: number;
  onReply: (comment: PostComment) => void;
  onLike: (commentId: string) => void;
};

function CommentRow({ comment, currentUserId, depth, onReply, onLike }: CommentRowProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const replyCount = comment.replies?.length ?? 0;
  const isHidden = comment.status === "hidden";
  const likeCount = comment.comment_likes?.length ?? 0;
  const isLiked = currentUserId
    ? (comment.comment_likes ?? []).some((l) => l.user_id === currentUserId)
    : false;

  return (
    <div className={depth > 0 ? "ml-7 pl-3 border-l border-slate-800/60" : ""}>
      {isHidden ? (
        <p className="text-[11px] text-slate-600 italic py-0.5">
          Commentaire masqué par un modérateur.
        </p>
      ) : (
        <div className="flex gap-2.5 group/row">
          <Link to={`/u/${comment.profile.username}`}>
            <UserAvatar
              username={comment.profile.username}
              displayName={comment.profile.display_name}
              avatarUrl={comment.profile.avatar_url}
              size="xs"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <Link
                to={`/u/${comment.profile.username}`}
                className="text-xs font-bold text-white hover:text-red-400 transition-colors"
              >
                {comment.profile.display_name ?? comment.profile.username}
              </Link>
              <span className="text-[10px] text-slate-600 font-mono">{relativeDate(comment.created_at)}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 break-words leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-3 mt-1">
              {/* Like */}
              <button
                onClick={() => onLike(comment.id)}
                disabled={!currentUserId}
                className={`text-[10px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-30 ${
                  isLiked ? "text-red-400" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? "fill-red-400" : ""}`} />
                {likeCount > 0 && <span className="font-mono">{likeCount}</span>}
              </button>

              {/* Répondre */}
              {currentUserId && depth === 0 && (
                <button
                  onClick={() => onReply(comment)}
                  className="text-[10px] font-semibold text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
                >
                  <CornerDownRight className="w-3 h-3" />
                  Répondre
                </button>
              )}

              {/* Afficher/masquer réponses */}
              {replyCount > 0 && (
                <button
                  onClick={() => setShowReplies((v) => !v)}
                  className="text-[10px] font-semibold text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
                >
                  {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {replyCount} réponse{replyCount > 1 ? "s" : ""}
                </button>
              )}

              {/* Signaler */}
              {currentUserId && comment.user_id !== currentUserId && (
                <button
                  onClick={() => setReportTarget(comment.id)}
                  className="opacity-0 group-hover/row:opacity-100 text-[10px] font-semibold text-slate-700 hover:text-red-500 transition-all flex items-center gap-1 ml-auto"
                  title="Signaler ce commentaire"
                >
                  <Flag className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Réponses */}
      {showReplies && replyCount > 0 && (
        <div className="mt-2 space-y-2.5">
          {comment.replies!.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      )}

      {reportTarget && (
        <ReportModal
          targetType="comment"
          targetId={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

export function FeedComments({ postId, currentUserId, onCommentAdded }: FeedCommentsProps) {
  const [tree, setTree] = useState<PostComment[]>([]);
  const [flat, setFlat] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [replyTarget, setReplyTarget] = useState<PostComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    setLoadError(null);
    const { data, error } = await supabase
      .from("post_comments")
      .select(COMMENT_SELECT)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      setLoadError(error.message);
    } else {
      const comments = (data ?? []) as unknown as PostComment[];
      setFlat(comments);
      setTree(buildTree(comments));
    }
    setLoading(false);
  }

  async function toggleLike(commentId: string) {
    if (!currentUserId) return;
    const comment = flat.find((c) => c.id === commentId);
    if (!comment) return;
    const isLiked = comment.comment_likes?.some((l) => l.user_id === currentUserId);

    // Mise à jour optimiste
    const updateFlat = flat.map((c) =>
      c.id === commentId
        ? {
            ...c,
            comment_likes: isLiked
              ? c.comment_likes.filter((l) => l.user_id !== currentUserId)
              : [...(c.comment_likes ?? []), { user_id: currentUserId }],
          }
        : c
    );
    setFlat(updateFlat);
    setTree(buildTree(updateFlat));

    if (isLiked) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUserId);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: currentUserId });
    }
  }

  function setReply(comment: PostComment) {
    setReplyTarget(comment);
    setInput(`@${comment.profile.username} `);
    inputRef.current?.focus();
  }

  function clearReply() {
    setReplyTarget(null);
    setInput("");
  }

  async function submitComment() {
    if (!input.trim() || !currentUserId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: currentUserId,
        content: input.trim(),
        parent_id: replyTarget?.id ?? null,
      })
      .select(COMMENT_SELECT)
      .single();

    if (error) {
      // PGRST116 = insert OK mais select retourne 0 lignes → recharger
      if (error.code === "PGRST116") {
        await loadComments();
        clearReply();
        onCommentAdded?.();
      } else {
        setSubmitError("Impossible d'envoyer le commentaire.");
        console.error("submitComment:", error.message);
      }
    } else if (data) {
      const newComment = data as unknown as PostComment;
      const nextFlat = [...flat, newComment];
      setFlat(nextFlat);
      setTree(buildTree(nextFlat));
      clearReply();
      onCommentAdded?.();
    }
    setSubmitting(false);
  }

  const totalCount = flat.length;

  return (
    <div className="border-t border-slate-800/60 pt-3 space-y-3">
      {loading ? (
        <p className="text-xs text-slate-600 px-1">Chargement…</p>
      ) : loadError ? (
        <p className="text-xs text-red-500 px-1">Erreur : {loadError}</p>
      ) : totalCount === 0 ? (
        <p className="text-xs text-slate-600 px-1">Aucun commentaire. Sois le premier !</p>
      ) : (
        <div className="space-y-3">
          {tree.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              depth={0}
              onReply={setReply}
              onLike={toggleLike}
            />
          ))}
        </div>
      )}

      {currentUserId && (
        <div className="space-y-1.5">
          {replyTarget && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 text-xs">
              <CornerDownRight className="w-3 h-3 text-slate-500" />
              <span className="text-slate-400 flex-1">
                Répondre à{" "}
                <span className="font-bold text-white">
                  {replyTarget.profile.display_name ?? replyTarget.profile.username}
                </span>
              </span>
              <button onClick={clearReply} className="text-slate-600 hover:text-white transition-colors text-[10px]">
                ✕
              </button>
            </div>
          )}
          {submitError && (
            <p className="text-[11px] text-red-400 px-1">{submitError}</p>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); }
                if (e.key === "Escape") clearReply();
              }}
              placeholder={replyTarget ? `Répondre à @${replyTarget.profile.username}…` : "Ajouter un commentaire…"}
              maxLength={500}
              className="flex-1 rounded-lg bg-slate-800/80 border border-slate-700/60 px-3 py-2 text-xs outline-none focus:border-red-500/70 transition-colors"
            />
            <button
              onClick={submitComment}
              disabled={!input.trim() || submitting}
              className="rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 px-3 py-2 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
