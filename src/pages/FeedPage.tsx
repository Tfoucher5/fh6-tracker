import { useEffect, useRef, useState } from "react";
import { Rss, Plus, Users, Globe } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { PostCard } from "../features/social/components/PostCard";
import { PostComposer } from "../features/social/components/PostComposer";
import { TrendingSection } from "../features/social/components/TrendingSection";
import { ChallengeCard } from "../features/challenges/ChallengeCard";
import { useFeed } from "../features/social/hooks/useFeed";
import { usePostComposer } from "../features/social/hooks/usePostComposer";
import { useSavedPosts } from "../features/social/hooks/useSavedPosts";
import { useAdminRole } from "../hooks/useAdminRole";
import { useActiveChallenge } from "../features/challenges/useChallenges";
import { useSEO } from "../hooks/useSEO";
import { supabase } from "../lib/supabase";

type FilterType = "all" | "following";

export default function FeedPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const {
    user, posts, loading, loadingMore, hasMore, error,
    loadMore, toggleLike, incrementCommentCount, deletePost, removePostFromFeed, addPost,
  } = useFeed(filter);
  const composer = usePostComposer(addPost);
  const { savedIds, toggleSave } = useSavedPosts();
  const adminRole = useAdminRole();
  const isAdmin = adminRole !== null;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { challenge, loading: challengeLoading } = useActiveChallenge(user?.id ?? null);

  useSEO({
    title: "Feed Forza Horizon 6",
    description: "Explore le feed de photos Forza Horizon 6. Découvrez les builds, likez les meilleures photos et rejoignez la communauté FH6 Tracker.",
    canonical: "/feed",
  });

  // Vérification des badges au chargement (silencieux, idempotent)
  useEffect(() => {
    if (!user) return;
    supabase.rpc("check_and_grant_badges", { p_user_id: user.id });
  }, [user?.id]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loadingMore) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">Communauté</p>
              <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">Feed</h1>
            </div>
            {user && (
              <button
                onClick={() => composer.setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-bold transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Poster
              </button>
            )}
          </div>

          {/* Défi de la semaine — skeleton pendant le chargement pour éviter CLS */}
          {challengeLoading ? (
            <div className="h-24 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
          ) : challenge ? (
            <ChallengeCard
              challenge={challenge}
              isParticipating={challenge.is_participating}
            />
          ) : null}

          {/* Trending */}
          {filter === "all" && <TrendingSection />}

          {/* Filter tabs — filtre "Abonnements" uniquement si connecté */}
          <div className="flex gap-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1">
            <TabButton active={filter === "all"} onClick={() => setFilter("all")} icon={<Globe className="w-4 h-4" />} label="Tous" />
            {user && (
              <TabButton active={filter === "following"} onClick={() => setFilter("following")} icon={<Users className="w-4 h-4" />} label="Abonnements" />
            )}
          </div>

          {/* Feed */}
          {loading ? (
            <LoadingState />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <p className="font-heading font-bold text-lg uppercase text-red-500">Erreur de chargement</p>
              <p className="text-sm text-slate-600 max-w-xs font-mono">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <EmptyState filter={filter} userId={user?.id ?? null} onPost={() => composer.setIsOpen(true)} />
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => {
                const isChallengeEntry = !!(
                  challenge?.car_id &&
                  post.car_id === challenge.car_id &&
                  post.created_at >= challenge.starts_at &&
                  post.created_at <= challenge.ends_at
                );
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id ?? null}
                    isSaved={savedIds.has(post.id)}
                    isAdmin={isAdmin}
                    isChallengeEntry={isChallengeEntry}
                    priority={index === 0}
                    onLike={toggleLike}
                    onDelete={deletePost}
                    onAdminHide={removePostFromFeed}
                    onSave={toggleSave}
                    onCommentAdded={incrementCommentCount}
                  />
                );
              })}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin" />
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-center text-xs text-slate-700 font-mono py-4">— fin du feed —</p>
              )}
            </div>
          )}
        </div>
      </div>

      <PostComposer composer={composer} />
    </PageLayout>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${active ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>
      {icon}{label}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden animate-pulse">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-slate-800 rounded w-28" />
              <div className="h-2 bg-slate-800/60 rounded w-16" />
            </div>
          </div>
          <div className="w-full aspect-video bg-slate-800/60" />
          <div className="px-4 py-3 space-y-2">
            <div className="h-3 bg-slate-800 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter, userId, onPost }: { filter: FilterType; userId: string | null; onPost: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center">
        <Rss className="w-7 h-7 text-slate-600" />
      </div>
      {filter === "following" ? (
        <>
          <p className="font-heading font-bold text-xl uppercase text-slate-500">Aucun post d'abonnements</p>
          <p className="text-sm text-slate-600 max-w-xs">Abonne-toi à d'autres joueurs pour voir leurs posts ici.</p>
        </>
      ) : (
        <>
          <p className="font-heading font-bold text-xl uppercase text-slate-500">Le feed est vide</p>
          <p className="text-sm text-slate-600 max-w-xs">Sois le premier à poster une photo de ta voiture !</p>
          {userId && (
            <button onClick={onPost} className="mt-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold transition-colors">
              Publier un post
            </button>
          )}
        </>
      )}
    </div>
  );
}
