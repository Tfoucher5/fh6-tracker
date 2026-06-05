import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Car, Users } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { UserAvatar } from "../features/social/components/UserAvatar";
import { ClassBadge } from "../components/ClassBadge";
import { supabase } from "../lib/supabase";

type UserResult = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xbox_gamertag: string | null;
};

type CarResult = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  car_class: string | null;
  pi: number | null;
  image_url: string | null;
};

type Tab = "cars" | "users";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("cars");

  useEffect(() => { document.title = "Recherche — FH6 Tracker"; }, []);
  const [cars, setCars] = useState<CarResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();

    if (q.length < 2) {
      setCars([]);
      setUsers([]);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      await Promise.all([searchCars(q), searchUsers(q)]);
      setLoading(false);
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  async function searchCars(q: string) {
    const { data } = await supabase
      .from("cars")
      .select("id, make, model, year, car_class, pi, image_url")
      .or(`make.ilike.%${q}%,model.ilike.%${q}%`)
      .order("make")
      .limit(30);
    setCars((data ?? []) as CarResult[]);
  }

  async function searchUsers(q: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, xbox_gamertag")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(20);
    setUsers((data ?? []) as UserResult[]);
  }

  const hasResults = cars.length > 0 || users.length > 0;
  const q = query.trim();

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">
              FH6 Tracker
            </p>
            <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">
              Recherche
            </h1>
          </div>

          {/* Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Voiture, joueur, marque…"
              className="w-full rounded-2xl bg-slate-900/60 border border-slate-800/80 pl-12 pr-4 py-4 text-base outline-none focus:border-red-500/60 transition-colors"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-600 border-t-red-500 rounded-full animate-spin" />
            )}
          </div>

          {/* Tabs (only if results exist) */}
          {q.length >= 2 && (
            <div className="flex gap-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1">
              <TabBtn active={tab === "cars"} onClick={() => setTab("cars")} icon={<Car className="w-4 h-4" />} label={`Voitures (${cars.length})`} />
              <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="w-4 h-4" />} label={`Joueurs (${users.length})`} />
            </div>
          )}

          {/* Results */}
          {q.length < 2 ? (
            <EmptySearch />
          ) : loading && !hasResults ? (
            <LoadingSkeleton tab={tab} />
          ) : tab === "cars" ? (
            cars.length === 0 ? (
              <NoResult query={q} entity="voiture" />
            ) : (
              <div className="space-y-2">
                {cars.map((car) => (
                  <Link
                    key={car.id}
                    to={`/cars/${car.id}`}
                    className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-3 hover:border-slate-700 transition-colors"
                  >
                    {car.image_url ? (
                      <img src={car.image_url} alt={`${car.make} ${car.model}`} className="w-16 h-10 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className="w-16 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {car.make} {car.model}
                      </p>
                      {car.year && <p className="text-xs font-mono text-slate-600">{car.year}</p>}
                    </div>
                    {car.car_class && <ClassBadge carClass={car.car_class} pi={car.pi} size="sm" />}
                  </Link>
                ))}
              </div>
            )
          ) : (
            users.length === 0 ? (
              <NoResult query={q} entity="joueur" />
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <Link
                    key={u.id}
                    to={`/u/${u.username}`}
                    className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-3 hover:border-slate-700 transition-colors"
                  >
                    <UserAvatar username={u.username} displayName={u.display_name} avatarUrl={u.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{u.display_name ?? u.username}</p>
                      <p className="text-xs font-mono text-slate-500">@{u.username}</p>
                    </div>
                    {u.xbox_gamertag && (
                      <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1 shrink-0">
                        {u.xbox_gamertag}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>
      {icon}{label}
    </button>
  );
}

function EmptySearch() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <Search className="w-12 h-12 text-slate-700" />
      <p className="font-heading font-bold text-xl uppercase text-slate-500">Recherche une voiture ou un joueur</p>
      <p className="text-sm text-slate-600">Minimum 2 caractères</p>
    </div>
  );
}

function NoResult({ query, entity }: { query: string; entity: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
      <p className="font-heading font-bold text-lg uppercase text-slate-500">Aucun{entity === "voiture" ? "e" : ""} {entity} pour "{query}"</p>
    </div>
  );
}

function LoadingSkeleton({ tab }: { tab: Tab }) {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-3 animate-pulse">
          <div className={`shrink-0 bg-slate-800 rounded-lg ${tab === "cars" ? "w-16 h-10" : "w-10 h-10 rounded-full"}`} />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-800 rounded w-1/2" />
            <div className="h-2 bg-slate-800/60 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
