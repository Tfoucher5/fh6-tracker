import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Target, Clock, Camera, Trophy, Users, ShieldCheck, CheckCircle2, EyeOff } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { PostCard } from "../features/social/components/PostCard";
import { useSavedPosts } from "../features/social/hooks/useSavedPosts";
import { useAdminRole } from "../hooks/useAdminRole";
import type { ChallengeCar } from "../features/challenges/useChallenges";
import type { FeedPost } from "../features/social/types";
import { supabase } from "../lib/supabase";

const POST_SELECT = `
  id, user_id, car_id, photo_url, storage_path, caption, created_at, status,
  profile:profiles!posts_user_id_fkey(id, username, display_name, avatar_url),
  car:cars(id, make, model, year, car_class, pi, image_url),
  post_likes(user_id),
  post_comments(id)
` as const;

type ChallengeDetail = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  car_id: string | null;
  car: ChallengeCar | null;
  leaderboard_published: boolean;
};

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

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { savedIds, toggleSave } = useSavedPosts();
  const adminRole = useAdminRole();
  const isAdmin = adminRole !== null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    if (id) load(id);
  }, [id]);

  async function load(challengeId: string) {
    setLoading(true);
    const { data: ch } = await supabase
      .from("challenges")
      .select("id, title, description, starts_at, ends_at, car_id, leaderboard_published, car:cars(id, make, model, year, image_url)")
      .eq("id", challengeId)
      .single();

    if (!ch) { setLoading(false); return; }
    const c = ch as unknown as ChallengeDetail;
    setChallenge(c);
    document.title = `${c.car ? `${c.car.make} ${c.car.model}` : c.title} — Défi FH6 Tracker`;

    if (!c.car_id) { setLoading(false); return; }

    const { data: postsData } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("car_id", c.car_id)
      .eq("status", "published")
      .gte("created_at", c.starts_at)
      .lte("created_at", c.ends_at)
      .order("created_at", { ascending: false });

    const rawPosts = (postsData ?? []) as unknown as FeedPost[];
    rawPosts.sort((a, b) => b.post_likes.length - a.post_likes.length);
    setPosts(rawPosts);
    setLoading(false);
  }

  async function publishLeaderboard() {
    if (!challenge) return;
    setPublishing(true);
    await supabase.from("challenges").update({ leaderboard_published: true }).eq("id", challenge.id);
    setChallenge((c) => c ? { ...c, leaderboard_published: true } : c);
    setPublishing(false);
  }

  function toggleLike(postId: string) {
    if (!user) return;
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const liked = p.post_likes.some((l) => l.user_id === user.id);
      if (liked) {
        supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
        return { ...p, post_likes: p.post_likes.filter((l) => l.user_id !== user.id) };
      } else {
        supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
        return { ...p, post_likes: [...p.post_likes, { user_id: user.id }] };
      }
    }));
  }

  function incrementCommentCount(postId: string) {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, post_comments: [...p.post_comments, { id: "tmp" }] } : p
    ));
  }

  function hidePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  const isOver = challenge ? new Date(challenge.ends_at) < new Date() : false;
  const remaining = challenge ? timeLeft(challenge.ends_at) : "";
  const pendingReview = isOver && !challenge?.leaderboard_published;

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au feed
          </Link>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : !challenge ? (
            <div className="py-20 text-center">
              <p className="font-heading font-bold text-xl uppercase text-slate-500">Défi introuvable</p>
            </div>
          ) : (
            <>
              {/* ── Hero ── */}
              <div className="relative rounded-2xl border border-red-500/20 overflow-hidden">
                {challenge.car?.image_url && (
                  <div className="absolute inset-0">
                    <img src={challenge.car.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/30" />
                  </div>
                )}
                <div className="relative p-6 space-y-3" style={{ minHeight: challenge.car?.image_url ? 200 : undefined }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">Défi de la semaine</span>
                  </div>

                  {challenge.car ? (
                    <div>
                      <h1 className="font-heading font-black text-4xl uppercase tracking-wide text-white leading-none">
                        {challenge.car.make}
                      </h1>
                      <h2 className="font-heading font-black text-3xl uppercase tracking-wide text-red-400 leading-none">
                        {challenge.car.model}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">{challenge.car.year}</p>
                    </div>
                  ) : (
                    <h1 className="font-heading font-black text-4xl uppercase tracking-wide text-white">{challenge.title}</h1>
                  )}

                  {challenge.description && <p className="text-sm text-slate-300">{challenge.description}</p>}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-red-400" />
                      {posts.length} photo{posts.length !== 1 ? "s" : ""} soumise{posts.length !== 1 ? "s" : ""}
                    </span>
                    <span className={`flex items-center gap-1.5 ${isOver ? "text-slate-600" : ""}`}>
                      <Clock className="w-4 h-4" />
                      {remaining}
                    </span>
                    {challenge.leaderboard_published && (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        Classement officiel
                      </span>
                    )}
                  </div>

                  {!isOver && (
                    <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-2.5 w-fit">
                      <Camera className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-slate-300">
                        Poste une photo de cette voiture depuis le feed pour participer
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Banner "En vérification" (non-admin, challenge terminé non publié) ── */}
              {pendingReview && !isAdmin && (
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-300">Classement en cours de vérification</p>
                    <p className="text-xs text-slate-500 mt-0.5">L'équipe vérifie les soumissions avant de publier le classement officiel.</p>
                  </div>
                </div>
              )}

              {/* ── Panel admin de vérification ── */}
              {pendingReview && isAdmin && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <p className="text-sm font-bold text-amber-400">Vérification des soumissions</p>
                    </div>
                    <button
                      onClick={publishLeaderboard}
                      disabled={publishing}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-bold transition-colors"
                    >
                      {publishing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Trophy className="w-4 h-4" />
                      )}
                      Publier le classement
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Vérifie que chaque photo montre bien la voiture demandée. Masque les soumissions incorrectes avant de publier.
                    {posts.length > 0 && ` ${posts.length} soumission${posts.length > 1 ? "s" : ""} à vérifier.`}
                  </p>
                </div>
              )}

              {/* ── Feed des soumissions ── */}
              {(!pendingReview || isAdmin) && (
                posts.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="font-heading font-bold text-xl uppercase text-slate-500">
                      {isOver ? "Aucune soumission" : "Aucune photo soumise"}
                    </p>
                    {!isOver && <p className="text-sm text-slate-600">Sois le premier à soumettre !</p>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-white">
                        {challenge.leaderboard_published ? "Classement officiel" : isOver ? "Soumissions — en attente de publication" : "Photos soumises"}
                      </h3>
                      {pendingReview && isAdmin && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400">
                          Mode vérif
                        </span>
                      )}
                    </div>
                    {posts.map((post, idx) => (
                      <div key={post.id} className="relative">
                        {(challenge.leaderboard_published || (!isOver)) && idx < 3 && (
                          <div className={`absolute -left-3 top-4 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                            idx === 0 ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                            idx === 1 ? "bg-slate-400/15 border-slate-400/30 text-slate-300" :
                                        "bg-orange-600/15 border-orange-600/30 text-orange-500"
                          }`}>
                            {idx + 1}
                          </div>
                        )}
                        {/* Bouton masquer admin en mode vérif */}
                        {pendingReview && isAdmin && (
                          <div className="absolute top-3 right-3 z-20">
                            <button
                              onClick={async () => {
                                await supabase.rpc("admin_hide_post", { p_post_id: post.id });
                                hidePost(post.id);
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white transition-colors"
                              title="Masquer cette soumission (invalide)"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              Invalide
                            </button>
                          </div>
                        )}
                        <PostCard
                          post={post}
                          currentUserId={user?.id ?? null}
                          isSaved={savedIds.has(post.id)}
                          isAdmin={isAdmin}
                          isChallengeEntry
                          onLike={toggleLike}
                          onDelete={hidePost}
                          onAdminHide={hidePost}
                          onSave={toggleSave}
                          onCommentAdded={incrementCommentCount}
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
