import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Car, Heart, LogIn, Search, Star, Trophy, UserRound, Rss, CalendarDays, ListChecks, Bookmark } from "lucide-react";
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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<DashboardCar[]>([]);
  const [statuses, setStatuses] = useState<DashboardStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

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
    }

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
  const missingCount = totalCars - ownedCount;
  const remainingPhotosCount = totalCars - photographedCount;
  const ownedPercent = totalCars > 0 ? Math.round((ownedCount / totalCars) * 100) : 0;
  const photoPercent = totalCars > 0 ? Math.round((photographedCount / totalCars) * 100) : 0;

  const recentActivity = useMemo(() => {
    return [...statuses]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map((status) => ({ status, car: cars.find((c) => c.id === status.car_id) }))
      .filter((item) => item.car);
  }, [statuses, cars]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center">
        <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-400 animate-pulse">
          Chargement…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-red-600/15 border border-red-500/25 flex items-center justify-center">
            <Car className="w-9 h-9 text-red-400" />
          </div>

          <div>
            <p className="font-heading text-sm font-bold uppercase tracking-[0.3em] text-red-500 mb-3">
              FH6 Tracker
            </p>
            <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-tight">
              Suis ton<br />garage FH6
            </h1>
            <p className="text-slate-400 mt-4 leading-relaxed">
              Connecte-toi pour gérer tes voitures, tes photos Horizon Promo et ta progression.
            </p>
          </div>

          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 font-bold transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">
              Bienvenue
            </p>
            <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">
              Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Vue rapide de ton garage et de ta progression Horizon Promo.
            </p>
          </header>

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
              description="Voir uniquement les voitures que tu n'as pas encore cochées comme obtenues."
              to="/catalogue?garage=missing"
              color="red"
            />
            <QuickLinkCard
              icon={<Camera className="w-5 h-5 text-emerald-400" />}
              title="Photos restantes"
              description="Filtrer directement les voitures non photographiées pour Horizon Promo."
              to="/catalogue?photo=missing"
              color="emerald"
            />
            <QuickLinkCard
              icon={<Heart className="w-5 h-5 text-amber-400" />}
              title="Favorites"
              description="Retrouver les voitures que tu as marquées comme favorites."
              to="/catalogue?favorite=true"
              color="amber"
            />
          </section>

          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickLinkCard icon={<Rss className="w-5 h-5 text-red-400" />} title="Feed" description="Posts et photos de la communauté." to="/feed" color="red" />
            <QuickLinkCard icon={<CalendarDays className="w-5 h-5 text-emerald-400" />} title="Événements" description="Rassemblements organisés par la commu." to="/events" color="emerald" />
            <QuickLinkCard icon={<ListChecks className="w-5 h-5 text-violet-400" />} title="Wishlist" description="Voitures que tu veux acquérir." to="/wishlist" color="violet" />
            <QuickLinkCard icon={<Bookmark className="w-5 h-5 text-amber-400" />} title="Sauvegardes" description="Posts que tu as mis de côté." to="/saved" color="amber" />
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <QuickLinkCard icon={<Trophy className="w-5 h-5 text-amber-400" />} title="Classement" description="Vois qui domine le garage, les photos, les posts et les abonnés." to="/leaderboard" color="amber" />
          </section>

          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <UserRound className="w-4 h-4 text-slate-500" />
              <h2 className="font-heading font-bold text-xl uppercase tracking-wide">
                Activité récente
              </h2>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Aucune activité pour l'instant. Commence par cocher quelques voitures dans le catalogue.
              </p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map(({ status, car }) => (
                  <div
                    key={`${status.car_id}-${status.updated_at}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-950/60 border border-slate-800/60 rounded-xl p-4"
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {car?.year ?? "N/A"} · {car?.make} {car?.model}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {status.owned ? "Possédée" : "Non possédée"} ·{" "}
                        {status.photographed ? "Photo OK" : "Photo à faire"} ·{" "}
                        {status.favorite ? "Favorite" : "Non favorite"}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 font-mono shrink-0">
                      {new Date(status.updated_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
}

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
};

function StatCard({ icon, label, value, detail }: StatCardProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="font-heading font-black text-4xl text-white leading-none">{value}</p>
      <p className="text-slate-500 text-xs mt-2">{detail}</p>
    </div>
  );
}

type ProgressCardProps = {
  icon: React.ReactNode;
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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="font-heading font-black text-4xl text-white leading-none">{value}</p>
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
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  color: "red" | "emerald" | "amber" | "violet";
};

const hoverBorder = {
  red: "hover:border-red-500/30",
  emerald: "hover:border-emerald-500/30",
  amber: "hover:border-amber-500/30",
  violet: "hover:border-violet-500/30",
};

const iconBg = {
  red: "bg-red-500/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  violet: "bg-violet-500/10",
};

function QuickLinkCard({ icon, title, description, to, color }: QuickLinkCardProps) {
  return (
    <Link
      to={to}
      className={`block bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 ${hoverBorder[color]} transition-colors group`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h2 className="font-heading font-bold text-lg uppercase tracking-wide text-white">
        {title}
      </h2>
      <p className="text-slate-400 text-sm mt-2 leading-relaxed">{description}</p>
    </Link>
  );
}
