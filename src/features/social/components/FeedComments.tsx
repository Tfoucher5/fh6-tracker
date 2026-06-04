import { useEffect, useRef, useState } from "react";
import { Send, CornerDownRight, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { PostComment } from "../types";
import { UserAvatar } from "./UserAvatar";
import { Link } from "react-router-dom";

type FeedCommentsProps = {
  postId: string;
  currentUserId: string | null;
  onCommentAdded?: () => void;
};

const COMMENT_SELECT =
  "id, post_id, user_id, content, created_at, parent_id, profile:profiles(username, display_name, avatar_url)";

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
  return roots;
}

type CommentRowProps = {
  comment: PostComment;
  currentUserId: string | null;
  depth: number;
  onReply: (comment: PostComment) => void;
};

function CommentRow({ comment, currentUserId, depth, onReply }: CommentRowProps) {
  const [showReplies, setShowReplies] = useState(true);
  const replyCount = comment.replies?.length ?? 0;

  return (
    <div className={depth > 0 ? "ml-7 pl-3 border-l border-slate-800/60" : ""}>
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
            {currentUserId && depth === 0 && (
              <button
                onClick={() => onReply(comment)}
                className="text-[10px] font-semibold text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" />
                Répondre
              </button>
            )}
            {replyCount > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="text-[10px] font-semibold text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
              >
                {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {replyCount} réponse{replyCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {showReplies && replyCount > 0 && (
        <div className="mt-2 space-y-2.5">
          {comment.replies!.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeedComments({ postId, currentUserId, onCommentAdded }: FeedCommentsProps) {
  const [tree, setTree] = useState<PostComment[]>([]);
  const [flat, setFlat] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [replyTarget, setReplyTarget] = useState<PostComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    const { data } = await supabase
      .from("post_comments")
      .select(COMMENT_SELECT)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    const comments = (data ?? []) as unknown as PostComment[];
    setFlat(comments);
    setTree(buildTree(comments));
    setLoading(false);
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

    if (!error && data) {
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
