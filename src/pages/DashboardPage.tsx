import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Car,
  Heart,
  LogIn,
  Search,
  Star,
  Trophy,
  UserRound,
} from "lucide-react";
import { supabase } from "../lib/supabase";

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

  const ownedCount = cars.filter((car) => statusByCarId.get(car.id)?.owned)
    .length;

  const photographedCount = cars.filter(
    (car) => statusByCarId.get(car.id)?.photographed
  ).length;

  const favoriteCount = cars.filter((car) => statusByCarId.get(car.id)?.favorite)
    .length;

  const missingCount = totalCars - ownedCount;
  const remainingPhotosCount = totalCars - photographedCount;

  const ownedPercent =
    totalCars > 0 ? Math.round((ownedCount / totalCars) * 100) : 0;

  const photoPercent =
    totalCars > 0 ? Math.round((photographedCount / totalCars) * 100) : 0;

  const recentActivity = useMemo(() => {
    return [...statuses]
      .sort((a, b) => {
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      })
      .slice(0, 5)
      .map((status) => {
        const car = cars.find((c) => c.id === status.car_id);

        return {
          status,
          car,
        };
      })
      .filter((item) => item.car);
  }, [statuses, cars]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Chargement du dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 py-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
            <Car className="w-8 h-8 text-red-300" />
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-red-400">
              FH6 Tracker
            </p>
            <h1 className="text-4xl font-bold mt-3">
              Suis ton garage FH6
            </h1>
            <p className="text-slate-400 mt-3">
              Connecte-toi pour gérer tes voitures obtenues, tes photos Horizon
              Promo et ta progression.
            </p>
          </div>

          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 font-semibold transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-red-400">
              FH6 Tracker
            </p>
            <h1 className="text-4xl font-bold mt-2">Dashboard</h1>
            <p className="text-slate-400 mt-2">
              Vue rapide de ton garage et de ta progression Horizon Promo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/catalogue"
              className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 font-semibold"
            >
              Catalogue
            </Link>

            <Link
              to="/profile"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2"
            >
              Profil
            </Link>
          </div>
        </header>

        {message && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-sm text-slate-300">
            {message}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Car className="w-6 h-6 text-red-300" />}
            label="Catalogue"
            value={String(totalCars)}
            detail="voitures référencées"
          />

          <ProgressCard
            icon={<Trophy className="w-6 h-6 text-red-300" />}
            label="Garage"
            value={`${ownedCount}/${totalCars}`}
            detail={`${missingCount} voiture(s) manquante(s)`}
            percent={ownedPercent}
            color="red"
          />

          <ProgressCard
            icon={<Camera className="w-6 h-6 text-emerald-300" />}
            label="Horizon Promo"
            value={`${photographedCount}/${totalCars}`}
            detail={`${remainingPhotosCount} photo(s) restante(s)`}
            percent={photoPercent}
            color="emerald"
          />

          <StatCard
            icon={<Star className="w-6 h-6 text-yellow-300" />}
            label="Favorites"
            value={String(favoriteCount)}
            detail="voiture(s) marquée(s)"
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <QuickLinkCard
            icon={<Search className="w-6 h-6 text-red-300" />}
            title="Voitures manquantes"
            description="Voir uniquement les voitures que tu n'as pas encore cochées comme obtenues."
            to="/catalogue?garage=missing"
          />

          <QuickLinkCard
            icon={<Camera className="w-6 h-6 text-emerald-300" />}
            title="Photos restantes"
            description="Filtrer directement les voitures non photographiées pour Horizon Promo."
            to="/catalogue?photo=missing"
          />

          <QuickLinkCard
            icon={<Heart className="w-6 h-6 text-yellow-300" />}
            title="Favorites"
            description="Retrouver les voitures que tu as marquées comme favorites."
            to="/catalogue?favorite=true"
          />
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <UserRound className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold">Activité récente</h2>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Aucune activité pour l’instant. Commence par cocher quelques
              voitures dans le catalogue.
            </p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(({ status, car }) => (
                <div
                  key={`${status.car_id}-${status.updated_at}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {car?.year ?? "N/A"} · {car?.make} {car?.model}
                    </p>
                    <p className="text-sm text-slate-500">
                      {status.owned ? "Possédée" : "Non possédée"} ·{" "}
                      {status.photographed ? "Photo OK" : "Photo à faire"} ·{" "}
                      {status.favorite ? "Favorite" : "Non favorite"}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500">
                    {new Date(status.updated_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{label}</p>
        {icon}
      </div>

      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-slate-500 text-sm mt-1">{detail}</p>
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

function ProgressCard({
  icon,
  label,
  value,
  detail,
  percent,
  color,
}: ProgressCardProps) {
  const barColor = color === "red" ? "bg-red-500" : "bg-emerald-500";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{label}</p>
        {icon}
      </div>

      <p className="text-3xl font-bold mt-2">{value}</p>

      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-slate-500 text-sm mt-2">
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
};

function QuickLinkCard({ icon, title, description, to }: QuickLinkCardProps) {
  return (
    <Link
      to={to}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-red-500/50 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
          {icon}
        </div>

        <span className="text-slate-500 group-hover:text-red-300 transition-colors">
          Ouvrir
        </span>
      </div>

      <h2 className="text-xl font-bold mt-4">{title}</h2>
      <p className="text-slate-400 text-sm mt-2">{description}</p>
    </Link>
  );
}
