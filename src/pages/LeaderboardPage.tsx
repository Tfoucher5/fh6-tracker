import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Rss, Users, Flame } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { UserAvatar } from "../features/social/components/UserAvatar";
import { supabase } from "../lib/supabase";

type LeaderEntry = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  score: number;
  best_streak?: number;
};

type Tab = "posts" | "followers" | "streaks";

const TABS: { id: Tab; label: string; icon: React.ReactNode; fn: string; unit: string; color: string }[] = [
  { id: "posts",     label: "Posts",   icon: <Rss className="w-4 h-4" />,   fn: "leaderboard_posts",     unit: "post",  color: "text-blue-400" },
  { id: "followers", label: "Abonnés", icon: <Users className="w-4 h-4" />, fn: "leaderboard_followers", unit: "abonné", color: "text-violet-400" },
  { id: "streaks",   label: "Streaks", icon: <Flame className="w-4 h-4" />, fn: "leaderboard_streaks",   unit: "jour",  color: "text-orange-400" },
];

const RANK_COLORS = ["text-amber-400", "text-slate-400", "text-orange-600"];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [data, setData] = useState<Record<Tab, LeaderEntry[] | null>>({
    posts: null, followers: null, streaks: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Classement — FH6 Tracker"; }, []);

  useEffect(() => {
    if (data[tab] !== null) return;
    loadTab(tab);
  }, [tab]);

  async function loadTab(t: Tab) {
    setLoading(true);
    const tabDef = TABS.find((x) => x.id === t)!;
    const { data: rows } = await supabase.rpc(tabDef.fn, { limit_n: 20 });
    setData((prev) => ({ ...prev, [t]: (rows ?? []) as LeaderEntry[] }));
    setLoading(false);
  }

  const current = TABS.find((t_) => t_.id === tab)!;
  const rows = data[tab];
  const isStreaks = tab === "streaks";

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          <header>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">Communauté</p>
            <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none flex items-center gap-3">
              <Trophy className="w-10 h-10 text-amber-400" />
              Classement
            </h1>
            <p className="text-slate-400 mt-2">Les meilleurs joueurs de la communauté FH6.</p>
          </header>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t.icon}
                <span className="hidden sm:block">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <LoadingSkeleton />
          ) : !rows || rows.length === 0 ? (
            <EmptyState isStreaks={isStreaks} />
          ) : (
            <div className="space-y-2">
              {/* Top 3 podium */}
              {rows.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[rows[1], rows[0], rows[2]].map((entry, podiumIdx) => {
                    const realRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                    return (
                      <Link
                        key={entry.user_id}
                        to={`/u/${entry.username}`}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors hover:bg-slate-800/80 ${
                          realRank === 1
                            ? "bg-amber-400/5 border-amber-400/30 order-2 py-6"
                            : realRank === 2
                            ? "bg-slate-700/20 border-slate-700/30 order-1"
                            : "bg-orange-600/5 border-orange-600/20 order-3"
                        }`}
                      >
                        <span className={`font-heading font-black text-2xl ${RANK_COLORS[realRank - 1]}`}>
                          #{realRank}
                        </span>
                        <UserAvatar
                          username={entry.username}
                          displayName={entry.display_name}
                          avatarUrl={entry.avatar_url}
                          size={realRank === 1 ? "lg" : "md"}
                        />
                        <div className="text-center">
                          <p className="text-xs font-bold text-white truncate max-w-[80px]">
                            {entry.display_name ?? entry.username}
                          </p>
                          <p className={`font-heading font-black text-lg ${current.color}`}>
                            {entry.score}
                          </p>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                            {current.unit}{Number(entry.score) > 1 ? "s" : ""}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Liste */}
              {(rows.length >= 3 ? rows.slice(3) : rows).map((entry, i) => (
                <Link
                  key={entry.user_id}
                  to={`/u/${entry.username}`}
                  className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-xl px-4 py-3 transition-colors"
                >
                  <span className="font-heading font-bold text-lg text-slate-600 w-8 text-center shrink-0">
                    #{rows.length >= 3 ? i + 4 : i + 1}
                  </span>
                  <UserAvatar
                    username={entry.username}
                    displayName={entry.display_name}
                    avatarUrl={entry.avatar_url}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {entry.display_name ?? entry.username}
                    </p>
                    <p className="text-xs font-mono text-slate-500">@{entry.username}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-heading font-black text-xl ${current.color}`}>
                      {entry.score}
                    </p>
                    {isStreaks && entry.best_streak != null ? (
                      <p className="text-[10px] text-slate-600">
                        record : {entry.best_streak}j
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                        {current.unit}{Number(entry.score) > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </PageLayout>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-3 animate-pulse">
          <div className="w-8 h-5 bg-slate-800 rounded" />
          <div className="w-8 h-8 rounded-full bg-slate-800" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-800 rounded w-32" />
            <div className="h-2 bg-slate-800/60 rounded w-20" />
          </div>
          <div className="w-10 h-6 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ isStreaks }: { isStreaks: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <Trophy className="w-12 h-12 text-slate-700" />
      <p className="font-heading font-bold text-xl uppercase text-slate-500">Pas encore de données</p>
      <p className="text-sm text-slate-600 max-w-xs">
        {isStreaks
          ? "Poste une photo ou crée un événement pour démarrer ta streak !"
          : "Sois le premier à rejoindre le classement !"}
      </p>
    </div>
  );
}
