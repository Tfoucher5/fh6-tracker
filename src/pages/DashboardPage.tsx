import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  Flame,
  Heart,
  ListChecks,
  LogIn,
  MessageCircle,
  Radio,
  Rss,
  Search,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { PageLayout } from "../components/PageLayout";

type DashboardCar = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  car_class: string | null;
  pi: number | null;
  image_url: string | null;
};

type DashboardStatus = {
  car_id: string;
  owned: boolean;
  photographed: boolean;
  favorite: boolean;
  updated_at: string;
};

type AccentColor = "red" | "emerald" | "amber" | "violet" | "sky";

type StreakData = {
  current_streak: number;
  best_streak: number;
  last_streak_date: string | null;
};

type UpcomingEvent = {
  id: string;
  title: string;
  event_date: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<DashboardCar[]>([]);
  const [statuses, setStatuses] = useState<DashboardStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);
    setStatuses([]);

    const { data: carsData, error: carsError } = await supabase
      .from("cars")
      .select("id, make, model, year, car_class, pi, image_url")
      .order("make", { ascending: true })
      .order("model", { ascending: true });

    if (carsError) {
      setMessage(carsError.message);
      setLoading(false);
      return;
    }

    setCars((carsData ?? []) as DashboardCar[]);

    if (currentUser) {
      const { data: statusData, error: statusError } = await supabase
        .from("user_cars")
        .select("car_id, owned, photographed, favorite, updated_at")
        .eq("user_id", currentUser.id);

      if (statusError) {
        setMessage(statusError.message);
        setLoading(false);
        return;
      }

      setStatuses((statusData ?? []) as DashboardStatus[]);

      // Streak data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("current_streak, best_streak, last_streak_date")
        .eq("id", currentUser.id)
        .single();

      if (profileData) setStreakData(profileData as StreakData);
    }

    // Upcoming events (accessible even without auth)
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, event_date")
      .eq("is_public", true)
      .gt("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(3);

    setUpcomingEvents((eventsData ?? []) as UpcomingEvent[]);

    setLoading(false);
  }

  const statusByCarId = useMemo(() => {
    const map = new Map<string, DashboardStatus>();

    for (const status of statuses) {
      map.set(status.car_id, status);
    }

    return map;
  }, [statuses]);

  const totalCars = cars.length;
  const ownedCount = cars.filter((car) => statusByCarId.get(car.id)?.owned).length;
  const photographedCount = cars.filter((car) => statusByCarId.get(car.id)?.photographed).length;
  const favoriteCount = cars.filter((car) => statusByCarId.get(car.id)?.favorite).length;

  const missingCount = Math.max(totalCars - ownedCount, 0);
  const remainingPhotosCount = Math.max(totalCars - photographedCount, 0);

  const ownedPercent = totalCars > 0 ? Math.round((ownedCount / totalCars) * 100) : 0;
  const photoPercent = totalCars > 0 ? Math.round((photographedCount / totalCars) * 100) : 0;

  const recentActivity = useMemo(() => {
    return [...statuses]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map((status) => ({
        status,
        car: cars.find((car) => car.id === status.car_id),
      }))
      .filter((item): item is { status: DashboardStatus; car: DashboardCar } => Boolean(item.car));
  }, [statuses, cars]);

  const nextObjective = useMemo(() => {
    if (missingCount > 0) {
      return {
        title: "Compléter ton garage",
        description: `${missingCount} voiture(s) encore à obtenir pour atteindre les 100 %.`,
        to: "/catalogue?garage=missing",
        icon: <Car className="w-5 h-5 text-red-400" />,
      };
    }

    if (remainingPhotosCount > 0) {
      return {
        title: "Finir Horizon Promo",
        description: `${remainingPhotosCount} photo(s) encore à valider.`,
        to: "/catalogue?photo=missing",
        icon: <Camera className="w-5 h-5 text-emerald-400" />,
      };
    }

    return {
      title: "Partager ta progression",
      description: "Ton suivi est complet. Publie ton garage ou organise une sortie avec la communauté.",
      to: "/feed",
      icon: <Rss className="w-5 h-5 text-sky-400" />,
    };
  }, [missingCount, remainingPhotosCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center animate-pulse">
            <Car className="w-7 h-7 text-red-400" />
          </div>
          <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-400">
            Chargement du hub…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050810] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.20),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_35%)]" />
        <div className="relative px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center justify-between mb-16">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.35)]">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-heading font-black text-xl uppercase tracking-wide leading-none">
                    FH6 Tracker
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">
                    Community hub
                  </p>
                </div>
              </Link>

              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 px-4 py-2 text-sm font-bold transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Connexion
              </Link>
            </nav>

            <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  Tracker de progression + réseau social Forza Horizon
                </div>

                <div>
                  <p className="font-heading text-sm font-bold uppercase tracking-[0.35em] text-red-500 mb-4">
                    FH6 Tracker
                  </p>
                  <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl uppercase tracking-wide text-white leading-[0.92]">
                    Ton garage.
                    <br />
                    Tes photos.
                    <br />
                    Ta communauté.
                  </h1>
                  <p className="text-slate-400 mt-6 max-w-2xl text-lg leading-relaxed">
                    Suis ta collection FH6, coche tes voitures possédées, valide tes photos Horizon Promo
                    et partage ta progression avec d’autres joueurs grâce au feed, aux likes, aux commentaires
                    et aux événements communautaires.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/auth"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 font-bold transition-colors shadow-[0_0_28px_rgba(239,68,68,0.30)]"
                  >
                    Commencer maintenant
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    to="/catalogue"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 hover:border-slate-500 px-6 py-3 font-bold transition-colors"
                  >
                    Explorer le catalogue
                    <Search className="w-5 h-5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
                  <MiniFeature icon={<Car />} label="Garage" />
                  <MiniFeature icon={<Camera />} label="Horizon Promo" />
                  <MiniFeature icon={<Rss />} label="Feed social" />
                  <MiniFeature icon={<CalendarDays />} label="Événements" />
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-6 bg-red-500/10 blur-3xl rounded-full" />
                <div className="relative bg-slate-950/80 border border-slate-800/90 rounded-[2rem] p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                        Aperçu du hub
                      </p>
                      <h2 className="font-heading font-black text-2xl uppercase">
                        Progression live
                      </h2>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-red-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PreviewCard icon={<Trophy />} title="Garage" value="72%" color="red" />
                    <PreviewCard icon={<Camera />} title="Photos" value="58%" color="emerald" />
                    <PreviewCard icon={<Heart />} title="Likes" value="1.2k" color="amber" />
                    <PreviewCard icon={<UsersRound />} title="Commu" value="Actif" color="sky" />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Sortie communautaire</p>
                        <p className="text-xs text-slate-500">
                          Rallye, photos, cruising et défis entre joueurs.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <UsersRound className="w-4 h-4" />
                      Organise ou rejoins des événements directement depuis le hub.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950 p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_35%)]" />

            <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 mb-5">
                  <Flame className="w-4 h-4 text-red-400" />
                  Hub communautaire FH6
                </div>

                <p className="font-heading text-xs font-bold uppercase tracking-[0.35em] text-red-500 mb-2">
                  Bienvenue
                </p>

                <h1 className="font-heading font-black text-5xl sm:text-6xl uppercase tracking-wide text-white leading-none">
                  Dashboard
                </h1>

                <p className="text-slate-400 mt-4 max-w-2xl leading-relaxed">
                  Suis ton garage, termine Horizon Promo et reste connecté à la communauté :
                  posts, likes, commentaires, abonnements, événements et classement.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Link
                    to={nextObjective.to}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 font-bold transition-colors"
                  >
                    {nextObjective.icon}
                    {nextObjective.title}
                  </Link>

                  <Link
                    to="/feed"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:border-slate-500 px-5 py-3 font-bold transition-colors"
                  >
                    <Rss className="w-5 h-5 text-sky-400" />
                    Voir le feed
                  </Link>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                      Objectif recommandé
                    </p>
                    <h2 className="font-heading font-black text-2xl uppercase mt-1">
                      {nextObjective.title}
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      {nextObjective.description}
                    </p>
                  </div>

                  <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
                    {nextObjective.icon}
                  </div>
                </div>

                <Link
                  to={nextObjective.to}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  Y aller
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {message && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-sm text-slate-300">
              {message}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Car className="w-5 h-5 text-red-400" />}
              label="Catalogue"
              value={String(totalCars)}
              detail="voitures référencées"
            />

            <ProgressCard
              icon={<Trophy className="w-5 h-5 text-red-400" />}
              label="Garage"
              value={`${ownedCount}/${totalCars}`}
              detail={`${missingCount} manquante(s)`}
              percent={ownedPercent}
              color="red"
            />

            <ProgressCard
              icon={<Camera className="w-5 h-5 text-emerald-400" />}
              label="Horizon Promo"
              value={`${photographedCount}/${totalCars}`}
              detail={`${remainingPhotosCount} restante(s)`}
              percent={photoPercent}
              color="emerald"
            />

            <StatCard
              icon={<Star className="w-5 h-5 text-amber-400" />}
              label="Favorites"
              value={String(favoriteCount)}
              detail="voiture(s) marquée(s)"
            />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <QuickLinkCard
              icon={<Search className="w-5 h-5 text-red-400" />}
              title="Voitures manquantes"
              description="Filtre le catalogue pour retrouver uniquement les voitures que tu dois encore obtenir."
              to="/catalogue?garage=missing"
              color="red"
            />

            <QuickLinkCard
              icon={<Camera className="w-5 h-5 text-emerald-400" />}
              title="Photos restantes"
              description="Termine Horizon Promo en affichant directement les voitures non photographiées."
              to="/catalogue?photo=missing"
              color="emerald"
            />

            <QuickLinkCard
              icon={<Heart className="w-5 h-5 text-amber-400" />}
              title="Favorites"
              description="Retrouve tes voitures préférées et garde-les sous la main pour tes prochains posts."
              to="/catalogue?favorite=true"
              color="amber"
            />
          </section>

          <section className="space-y-4">
            <SectionHeader
              eyebrow="Communauté"
              title="Explore le hub"
              description="Publie, réagis, suis d’autres joueurs et participe aux événements créés par la communauté."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <QuickLinkCard
                icon={<Rss className="w-5 h-5 text-red-400" />}
                title="Feed"
                description="Découvre les posts, garages, photos et updates des autres joueurs."
                to="/feed"
                color="red"
              />

              <QuickLinkCard
                icon={<CalendarDays className="w-5 h-5 text-emerald-400" />}
                title="Événements"
                description="Rejoins ou organise des meetings, cruises, sessions photo et défis en jeu."
                to="/events"
                color="emerald"
              />

              <QuickLinkCard
                icon={<ListChecks className="w-5 h-5 text-violet-400" />}
                title="Wishlist"
                description="Prépare ta liste de voitures prioritaires à obtenir."
                to="/wishlist"
                color="violet"
              />

              <QuickLinkCard
                icon={<Bookmark className="w-5 h-5 text-amber-400" />}
                title="Sauvegardes"
                description="Retrouve les posts que tu as mis de côté pour plus tard."
                to="/saved"
                color="amber"
              />
            </div>
          </section>

          {/* Streak + Événements à venir */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user && <StreakWidget streakData={streakData} />}
            <UpcomingEventsWidget events={upcomingEvents} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              <SectionHeader
                eyebrow="Classement"
                title="Challenge communautaire"
                description="Compare ta progression avec les autres joueurs."
                compact
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                <CommunityMetric icon={<Trophy />} label="Garage" value="Collection" />
                <CommunityMetric icon={<Camera />} label="Photos" value="Horizon Promo" />
                <CommunityMetric icon={<MessageCircle />} label="Posts" value="Activité" />
                <CommunityMetric icon={<UserPlus />} label="Abonnés" value="Influence" />
              </div>

              <Link
                to="/leaderboard"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 px-5 py-3 font-bold text-amber-300 transition-colors w-full"
              >
                Voir le classement
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UserRound className="w-4 h-4 text-slate-500" />
                  <h2 className="font-heading font-bold text-xl uppercase tracking-wide">
                    Activité récente
                  </h2>
                </div>

                <Link
                  to="/catalogue"
                  className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Catalogue
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <div className="rounded-xl bg-slate-950/60 border border-slate-800/60 p-5">
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Aucune activité pour l’instant. Commence par cocher quelques voitures dans le catalogue,
                    puis utilise le feed pour partager ta progression avec la communauté.
                  </p>

                  <Link
                    to="/catalogue"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    Ouvrir le catalogue
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map(({ status, car }) => (
                    <ActivityItem
                      key={`${status.car_id}-${status.updated_at}`}
                      status={status}
                      car={car}
                    />
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
};

function StatCard({ icon, label, value, detail }: StatCardProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-red-500/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <p className="font-heading font-black text-4xl text-white leading-none">
        {value}
      </p>

      <p className="text-slate-500 text-xs mt-2">
        {detail}
      </p>
    </div>
  );
}

type ProgressCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  percent: number;
  color: "red" | "emerald";
};

function ProgressCard({ icon, label, value, detail, percent, color }: ProgressCardProps) {
  const barColor = color === "red" ? "bg-red-500" : "bg-emerald-500";
  const barGlow =
    color === "red"
      ? "shadow-[0_0_8px_0px_rgba(239,68,68,0.6)]"
      : "shadow-[0_0_8px_0px_rgba(16,185,129,0.6)]";

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-red-500/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <p className="font-heading font-black text-4xl text-white leading-none">
        {value}
      </p>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
        <div
          className={`h-full rounded-full ${barColor} ${barGlow} transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-slate-500 text-xs mt-2">
        {percent}% · {detail}
      </p>
    </div>
  );
}

type QuickLinkCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  to: string;
  color: AccentColor;
};

const hoverBorder: Record<AccentColor, string> = {
  red: "hover:border-red-500/35",
  emerald: "hover:border-emerald-500/35",
  amber: "hover:border-amber-500/35",
  violet: "hover:border-violet-500/35",
  sky: "hover:border-sky-500/35",
};

const iconBg: Record<AccentColor, string> = {
  red: "bg-red-500/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  violet: "bg-violet-500/10",
  sky: "bg-sky-500/10",
};

function QuickLinkCard({ icon, title, description, to, color }: QuickLinkCardProps) {
  return (
    <Link
      to={to}
      className={`block bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 ${hoverBorder[color]} transition-colors group`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg[color]} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-lg uppercase tracking-wide text-white">
            {title}
          </h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors shrink-0 mt-1" />
      </div>
    </Link>
  );
}

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  compact?: boolean;
};

function SectionHeader({ eyebrow, title, description, compact = false }: SectionHeaderProps) {
  return (
    <div>
      <p className="font-heading text-xs font-bold uppercase tracking-[0.25em] text-red-500 mb-2">
        {eyebrow}
      </p>

      <h2 className={`font-heading font-black uppercase tracking-wide text-white ${compact ? "text-2xl" : "text-3xl"}`}>
        {title}
      </h2>

      <p className="text-slate-400 text-sm mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

type ActivityItemProps = {
  status: DashboardStatus;
  car: DashboardCar;
};

function ActivityItem({ status, car }: ActivityItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950/60 border border-slate-800/60 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-red-400" />
        </div>

        <div>
          <p className="font-semibold text-sm">
            {car.year ?? "N/A"} · {car.make} {car.model}
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            <ActivityBadge active={status.owned} label={status.owned ? "Possédée" : "Non possédée"} />
            <ActivityBadge active={status.photographed} label={status.photographed ? "Photo OK" : "Photo à faire"} />
            <ActivityBadge active={status.favorite} label={status.favorite ? "Favorite" : "Non favorite"} />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 font-mono shrink-0">
        {new Date(status.updated_at).toLocaleString("fr-FR")}
      </p>
    </div>
  );
}

type ActivityBadgeProps = {
  active: boolean;
  label: string;
};

function ActivityBadge({ active, label }: ActivityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          : "bg-slate-800 text-slate-500 border border-slate-700"
      }`}
    >
      {active && <CheckCircle2 className="w-3 h-3" />}
      {label}
    </span>
  );
}

type MiniFeatureProps = {
  icon: ReactNode;
  label: string;
};

function MiniFeature({ icon, label }: MiniFeatureProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-red-400 mb-3">
        {icon}
      </div>
      <p className="text-sm font-bold text-white">
        {label}
      </p>
    </div>
  );
}

type PreviewCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  color: AccentColor;
};

const previewText: Record<AccentColor, string> = {
  red: "text-red-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  violet: "text-violet-400",
  sky: "text-sky-400",
};

function PreviewCard({ icon, title, value, color }: PreviewCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className={`w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center ${previewText[color]} mb-3`}>
        {icon}
      </div>

      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
        {title}
      </p>

      <p className="font-heading font-black text-2xl uppercase mt-1">
        {value}
      </p>
    </div>
  );
}

type CommunityMetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function CommunityMetric({ icon, label, value }: CommunityMetricProps) {
  return (
    <div className="rounded-xl bg-slate-950/60 border border-slate-800/70 p-4">
      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 mb-3">
        {icon}
      </div>

      <p className="font-bold text-sm text-white">
        {label}
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {value}
      </p>
    </div>
  );
}

function StreakWidget({ streakData }: { streakData: StreakData | null }) {
  const todayStr = new Date().toLocaleDateString("sv-SE"); // "YYYY-MM-DD"
  const todayValidated = streakData?.last_streak_date === todayStr;
  const currentStreak = streakData?.current_streak ?? 0;
  const bestStreak = streakData?.best_streak ?? 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h2 className="font-heading font-bold text-xl uppercase tracking-wide text-white">Streak</h2>
        </div>
        <Link to="/leaderboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Classement →
        </Link>
      </div>

      <div className="flex items-end gap-6 mb-4">
        <div>
          <p className="font-heading font-black text-6xl text-orange-400 leading-none">{currentStreak}</p>
          <p className="text-sm text-slate-400 mt-1">jours consécutifs</p>
        </div>
        <div className="pb-1">
          <p className="font-heading font-black text-2xl text-slate-400">{bestStreak}</p>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Record</p>
        </div>
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
        todayValidated
          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          : "bg-orange-500/10 text-orange-300 border border-orange-500/20"
      }`}>
        {todayValidated ? (
          <>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Journée validée — reviens demain !
          </>
        ) : (
          <>
            <Flame className="w-4 h-4 shrink-0" />
            {currentStreak > 0 ? "Poste aujourd'hui pour continuer ta série" : "Poste pour démarrer ta streak"}
          </>
        )}
      </div>
    </div>
  );
}

function eventBadge(eventDate: string): { label: string; className: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(eventDate);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { label: "Aujourd'hui", className: "bg-red-500/15 text-red-300 border border-red-500/25" };
  if (diff === 1) return { label: "Demain", className: "bg-orange-500/15 text-orange-300 border border-orange-500/25" };
  if (diff <= 7) return { label: `Dans ${diff}j`, className: "bg-amber-500/15 text-amber-300 border border-amber-500/25" };
  return { label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), className: "bg-slate-800 text-slate-400 border border-slate-700" };
}

function UpcomingEventsWidget({ events }: { events: UpcomingEvent[] }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-emerald-400" />
          <h2 className="font-heading font-bold text-xl uppercase tracking-wide text-white">Événements</h2>
        </div>
        <Link to="/events" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Tous →
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <CalendarDays className="w-8 h-8 text-slate-700" />
          <p className="text-sm text-slate-500">Aucun événement à venir</p>
          <Link to="/events" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-1">
            Créer un événement →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const badge = eventBadge(event.event_date);
            return (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/60 rounded-xl px-4 py-3 hover:border-slate-700 transition-colors"
              >
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>
                <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0 ml-auto" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}