import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Car, GamepadIcon, LayoutGrid, Image, UserPlus, UserCheck, Loader2, GitCompare, Flame, Trophy, Flag, Medal } from "lucide-react";
import { ReportModal } from "../features/social/components/ReportModal";
import { useAdminRole } from "../hooks/useAdminRole";
import { PageLayout } from "../components/PageLayout";
import { UserAvatar } from "../features/social/components/UserAvatar";
import { PostCard } from "../features/social/components/PostCard";
import { ClassBadge } from "../components/ClassBadge";
import { BadgeCard } from "../features/badges/BadgeCard";
import { BADGE_DEFINITIONS, TIER_LABELS } from "../features/badges/badgeDefinitions";
import type { BadgeTier } from "../features/badges/badgeDefinitions";
import { useFollows } from "../features/social/hooks/useFollows";
import { supabase } from "../lib/supabase";
import type { FeedPost } from "../features/social/types";

type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xbox_gamertag: string | null;
  banner_url: string | null;
  bio: string | null;
  is_public: boolean;
  current_streak: number;
  best_streak: number;
  last_valid_activity_at: string | null;
};

type OwnedCar = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  car_class: string | null;
  pi: number | null;
  image_url: string | null;
};

type TabType = "posts" | "garage" | "compare" | "badges";
type EarnedBadge = { badge_id: string; earned_at: string };

const POST_SELECT = `
  id, user_id, car_id, photo_url, storage_path, caption, created_at,
  profile:profiles!posts_user_id_fkey(id, username, display_name, avatar_url),
  car:cars(id, make, model, year, car_class, pi, image_url),
  post_likes(user_id),
  post_comments(id)
` as const;

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [ownedCars, setOwnedCars] = useState<OwnedCar[]>([]);
  const [garageLoading, setGarageLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [myCarIds, setMyCarIds] = useState<Set<string> | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const adminRole = useAdminRole();
  const isAdmin = adminRole !== null;

  const {
    currentUserId: followCurrentUserId,
    followers,
    following,
    isFollowing,
    loading: followLoading,
    initialized,
    toggleFollow,
  } = useFollows(profile?.id ?? "");

  useEffect(() => {
    if (!username) return;
    loadProfile(username);
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    if (tab === "posts") loadPosts(profile.id);
    else if (tab === "garage") loadGarage(profile.id);
    else if (tab === "compare") loadCompare(profile.id);
    else if (tab === "badges") loadBadges(profile.id);
  }, [profile, tab]);

  async function loadBadges(userId: string) {
    setBadgesLoading(true);
    const { data } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", userId)
      .order("earned_at", { ascending: true });
    setEarnedBadges((data ?? []) as EarnedBadge[]);
    setBadgesLoading(false);
  }

  async function loadProfile(uname: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, banner_url, xbox_gamertag, bio, is_public, current_streak, best_streak, last_valid_activity_at")
      .eq("username", uname)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
      document.title = "Profil introuvable — FH6 Tracker";
    } else {
      setProfile(data);
      document.title = `${data.display_name ?? data.username} (@${data.username}) — FH6 Tracker`;
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", data.id)
        .then(({ count }) => setPostCount(count ?? 0));
    }
    setLoading(false);
  }

  async function loadPosts(userId: string) {
    setPostsLoading(true);
    const { data } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("user_id", userId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts((data ?? []) as unknown as FeedPost[]);
    setPostsLoading(false);
  }

  async function loadGarage(userId: string) {
    setGarageLoading(true);
    const { data } = await supabase
      .from("user_cars")
      .select("car:cars(id, make, model, year, car_class, pi, image_url)")
      .eq("user_id", userId)
      .eq("owned", true);

    const cars = (data ?? [])
      .map((row: { car: OwnedCar | OwnedCar[] | null }) => {
        const c = row.car;
        return Array.isArray(c) ? c[0] : c;
      })
      .filter(Boolean) as OwnedCar[];

    setOwnedCars(cars);
    setGarageLoading(false);
  }

  async function loadCompare(targetUserId: string) {
    if (!currentUserId) return;
    setCompareLoading(true);

    // Load current user's owned car IDs
    const { data } = await supabase
      .from("user_cars")
      .select("car_id")
      .eq("user_id", currentUserId)
      .eq("owned", true);

    setMyCarIds(new Set((data ?? []).map((r: { car_id: string }) => r.car_id)));

    // Also make sure garage is loaded
    if (ownedCars.length === 0) await loadGarage(targetUserId);
    setCompareLoading(false);
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-400 animate-pulse">
            Chargement…
          </p>
        </div>
      </PageLayout>
    );
  }

  if (notFound || !profile) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-500">
            Profil introuvable
          </p>
          <Link to="/feed" className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Retour au feed
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isOwnProfile = currentUserId === profile.id;
  const canFollow = initialized && followCurrentUserId && followCurrentUserId !== profile.id;

  return (
    <>
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back */}
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Feed
          </Link>

          {/* Profile header avec bannière */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
            {/* Banner */}
            <div className="relative h-32 sm:h-44">
              {profile.banner_url ? (
                <img src={profile.banner_url} alt="Bannière" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-800/80 to-slate-900" />
              )}
            </div>

            <div className="px-6 pb-6">
              {/* Avatar overlap + bouton action */}
              <div className="flex items-end justify-between -mt-10 mb-4 relative z-10">
                <div className="ring-4 ring-[#050810] rounded-full">
                  <UserAvatar
                    username={profile.username}
                    displayName={profile.display_name}
                    avatarUrl={profile.avatar_url}
                    size="xl"
                  />
                </div>
                {isOwnProfile ? (
                  <Link
                    to="/profile"
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-4 py-2 text-sm font-bold text-slate-300 transition-colors"
                  >
                    Modifier
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    {canFollow && (
                      <button
                        onClick={toggleFollow}
                        disabled={followLoading}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${
                          isFollowing
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            : "bg-red-600 hover:bg-red-500 text-white"
                        }`}
                      >
                        {followLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isFollowing ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        {isFollowing ? "Abonné" : "Suivre"}
                      </button>
                    )}
                    {currentUserId && (
                      <button
                        onClick={() => setShowReport(true)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-500 hover:text-red-500 transition-colors"
                        title="Signaler ce profil"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Nom + gamertag */}
              <div className="space-y-1 mb-4">
                <h1 className="font-heading font-black text-3xl uppercase tracking-wide text-white leading-tight">
                  {profile.display_name ?? profile.username}
                </h1>
                <p className="text-sm font-mono text-slate-500">@{profile.username}</p>
                {profile.xbox_gamertag && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                    <GamepadIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono">{profile.xbox_gamertag}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 pt-3 border-t border-slate-800/60">
                <Stat value={followers} label="Abonnés" />
                <Stat value={following} label="Abonnements" />
                <Stat value={postCount} label="Posts" />
              </div>

              {/* Streak */}
              {profile.current_streak > 0 && (
                <div className="flex items-center gap-4 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="font-heading font-black text-lg text-orange-400">{profile.current_streak}</span>
                    <span className="text-xs text-slate-500">j de streak</span>
                  </div>
                  {profile.best_streak > profile.current_streak && (
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="font-heading font-bold text-base text-amber-400">{profile.best_streak}</span>
                      <span className="text-xs text-slate-500">record</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-slate-300 leading-relaxed mt-4">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1">
            <TabButton active={tab === "posts"} onClick={() => setTab("posts")} icon={<Image className="w-4 h-4" />} label="Posts" />
            <TabButton active={tab === "garage"} onClick={() => setTab("garage")} icon={<LayoutGrid className="w-4 h-4" />} label={`Garage${ownedCars.length > 0 ? ` (${ownedCars.length})` : ""}`} />
            <TabButton active={tab === "badges"} onClick={() => setTab("badges")} icon={<Medal className="w-4 h-4" />} label="Badges" />
            {!isOwnProfile && currentUserId && (
              <TabButton active={tab === "compare"} onClick={() => setTab("compare")} icon={<GitCompare className="w-4 h-4" />} label="Comparer" />
            )}
          </div>

          {/* Content */}
          {tab === "badges" ? (
            badgesLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin" />
              </div>
            ) : (
              <BadgesCollection earnedBadges={earnedBadges} />
            )
          ) : tab === "compare" ? (
            compareLoading || myCarIds === null ? (
              <LoadingGarage />
            ) : (
              <GarageComparison myCarIds={myCarIds} theirCars={ownedCars} />
            )
          ) : tab === "posts" ? (
            postsLoading ? (
              <LoadingFeed />
            ) : posts.length === 0 ? (
              <EmptyPosts username={profile.username} />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onLike={() => {}}
                    onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                    onAdminHide={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                    onCommentAdded={() => {}}
                  />
                ))}
              </div>
            )
          ) : garageLoading ? (
            <LoadingGarage />
          ) : ownedCars.length === 0 ? (
            <EmptyGarage username={profile.username} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ownedCars.map((car) => (
                <Link
                  key={car.id}
                  to={`/cars/${car.id}`}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors"
                >
                  {car.image_url ? (
                    <img
                      src={car.image_url}
                      alt={`${car.make} ${car.model}`}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-slate-950/60 flex items-center justify-center">
                      <Car className="w-8 h-8 text-slate-700" />
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white truncate">
                        {car.make} {car.model}
                      </p>
                      {car.car_class && <ClassBadge carClass={car.car_class} pi={car.pi} size="sm" />}
                    </div>
                    {car.year && <p className="text-[10px] font-mono text-slate-600">{car.year}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>

    {showReport && (
      <ReportModal targetType="profile" targetId={profile.id} onClose={() => setShowReport(false)} />
    )}
  </>
  );
}

const TIER_ORDER: BadgeTier[] = ["red", "gold", "silver", "bronze"];

function BadgesCollection({ earnedBadges }: { earnedBadges: EarnedBadge[] }) {
  const earnedMap = Object.fromEntries(earnedBadges.map((b) => [b.badge_id, b.earned_at]));
  const earnedCount = earnedBadges.length;
  const totalCount = BADGE_DEFINITIONS.length;

  return (
    <div className="space-y-6">
      {/* Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-white">{earnedCount}</span> badge{earnedCount !== 1 ? "s" : ""} gagné{earnedCount !== 1 ? "s" : ""} sur {totalCount}
        </p>
        {/* Progress bar */}
        <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges par tier */}
      {TIER_ORDER.map((tier) => {
        const defs = BADGE_DEFINITIONS.filter((b) => b.tier === tier);
        return (
          <div key={tier} className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
              {TIER_LABELS[tier]}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {defs.map((def) => (
                <BadgeCard
                  key={def.id}
                  badge={def}
                  earned={!!earnedMap[def.id]}
                  earnedAt={earnedMap[def.id]}
                  size="md"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-heading font-black text-2xl text-white">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function LoadingFeed() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="w-full aspect-video bg-slate-800/60" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-800/60 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingGarage() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="w-full aspect-video bg-slate-800/60" />
          <div className="p-3 space-y-1.5">
            <div className="h-3 bg-slate-800 rounded w-3/4" />
            <div className="h-2 bg-slate-800/60 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPosts({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <Image className="w-10 h-10 text-slate-700" />
      <p className="font-heading font-bold text-lg uppercase text-slate-500">
        @{username} n'a pas encore posté
      </p>
    </div>
  );
}

function EmptyGarage({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <Car className="w-10 h-10 text-slate-700" />
      <p className="font-heading font-bold text-lg uppercase text-slate-500">
        Le garage de @{username} est vide
      </p>
    </div>
  );
}

function GarageComparison({ myCarIds, theirCars }: { myCarIds: Set<string>; theirCars: OwnedCar[] }) {
  const theyHaveIDoNot = theirCars.filter((c) => !myCarIds.has(c.id));
  const commonCount = theirCars.filter((c) => myCarIds.has(c.id)).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="font-heading font-black text-2xl text-red-400">{theyHaveIDoNot.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-1">Ils ont, pas toi</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="font-heading font-black text-2xl text-emerald-400">{commonCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-1">En commun</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="font-heading font-black text-2xl text-slate-400">{myCarIds.size - commonCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-1">Tu as, pas eux</p>
        </div>
      </div>

      {/* Cars they have that I don't */}
      {theyHaveIDoNot.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-red-400">
            À acquérir — {theyHaveIDoNot.length} voiture{theyHaveIDoNot.length > 1 ? "s" : ""}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {theyHaveIDoNot.map((car) => (
              <Link
                key={car.id}
                to={`/cars/${car.id}`}
                className="bg-slate-900/60 border border-red-500/20 rounded-xl overflow-hidden hover:border-red-500/40 transition-colors"
              >
                {car.image_url ? (
                  <img src={car.image_url} alt={`${car.make} ${car.model}`} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-slate-950/60 flex items-center justify-center">
                    <Car className="w-6 h-6 text-slate-700" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-[10px] font-bold text-white truncate">{car.make} {car.model}</p>
                  {car.car_class && <ClassBadge carClass={car.car_class} pi={car.pi} size="sm" />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {theyHaveIDoNot.length === 0 && (
        <div className="text-center py-10">
          <p className="font-heading font-bold text-xl uppercase text-emerald-400">Tu as toutes leurs voitures !</p>
          <p className="text-sm text-slate-600 mt-2">Votre collection est identique ou tu as plus qu'eux.</p>
        </div>
      )}
    </div>
  );
}
