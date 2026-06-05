import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, LogIn } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { PostCard } from "../features/social/components/PostCard";
import { useSavedPosts } from "../features/social/hooks/useSavedPosts";
import { supabase } from "../lib/supabase";
import type { FeedPost } from "../features/social/types";

const POST_SELECT = `
  id, user_id, car_id, photo_url, storage_path, caption, created_at,
  profile:profiles!posts_user_id_fkey(id, username, display_name, avatar_url),
  car:cars(id, make, model, year, car_class, pi, image_url),
  post_likes(user_id),
  post_comments(id)
` as const;

export default function SavedPage() {
  const { savedIds, toggleSave, userId, loading: savedLoading } = useSavedPosts();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => { document.title = "Posts sauvegardés — FH6 Tracker"; }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (savedLoading) return;
    if (savedIds.size === 0) { setPostsLoading(false); return; }
    loadSavedPosts();
  }, [savedLoading, savedIds.size]);

  async function loadSavedPosts() {
    setPostsLoading(true);
    const { data } = await supabase
      .from("saved_posts")
      .select(`created_at, post:posts(${POST_SELECT})`)
      .eq("user_id", userId!)
      .order("created_at", { ascending: false })
      .limit(50);

    const loaded = ((data ?? []) as unknown as Array<{ post: FeedPost | FeedPost[] | null }>)
      .map((r) => {
        const p = r.post;
        return Array.isArray(p) ? p[0] : p;
      })
      .filter(Boolean) as FeedPost[];

    setPosts(loaded);
    setPostsLoading(false);
  }

  function handleUnsave(postId: string) {
    toggleSave(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  const loading = savedLoading || postsLoading;

  if (!loading && !currentUserId) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-500">Connecte-toi pour voir tes sauvegardes</p>
          <Link to="/auth" className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold transition-colors">
            <LogIn className="w-4 h-4" />
            Se connecter
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">Mon compte</p>
            <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">Sauvegardes</h1>
            {!loading && <p className="text-slate-400 mt-2 text-sm">{posts.length} post{posts.length !== 1 ? "s" : ""} sauvegardé{posts.length !== 1 ? "s" : ""}</p>}
          </div>

          {loading ? (
            <LoadingState />
          ) : posts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  isSaved={savedIds.has(post.id)}
                  onLike={() => {}}
                  onDelete={() => {}}
                  onSave={handleUnsave}
                  onCommentAdded={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden animate-pulse">
          <div className="w-full aspect-video bg-slate-800/60" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-slate-800 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center">
        <Bookmark className="w-7 h-7 text-slate-600" />
      </div>
      <p className="font-heading font-bold text-xl uppercase text-slate-500">Aucune sauvegarde</p>
      <p className="text-sm text-slate-600 max-w-xs">Sauvegarde des posts depuis le feed pour les retrouver ici.</p>
      <Link to="/feed" className="mt-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold transition-colors">
        Aller sur le feed
      </Link>
    </div>
  );
}
