import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, Car, LogIn } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { ClassBadge } from "../components/ClassBadge";
import { supabase } from "../lib/supabase";

type WishlistCar = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  car_class: string | null;
  pi: number | null;
  image_url: string | null;
};

export default function WishlistPage() {
  const [cars, setCars] = useState<WishlistCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("user_cars")
        .select("car:cars(id, make, model, year, car_class, pi, image_url)")
        .eq("user_id", user.id)
        .eq("wanted", true);

      const loaded = (data ?? [])
        .map((r: { car: WishlistCar | WishlistCar[] | null }) => {
          const c = r.car;
          return Array.isArray(c) ? c[0] : c;
        })
        .filter(Boolean) as WishlistCar[];

      setCars(loaded);
      setLoading(false);
    })();
  }, []);

  async function removeFromWishlist(carId: string) {
    if (!userId) return;
    setCars((prev) => prev.filter((c) => c.id !== carId));
    await supabase
      .from("user_cars")
      .update({ wanted: false })
      .eq("user_id", userId)
      .eq("car_id", carId);
  }

  if (!loading && !userId) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-500">Connecte-toi pour voir ta wishlist</p>
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
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">Mon garage</p>
            <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">Wishlist</h1>
            {!loading && (
              <p className="text-slate-400 mt-2 text-sm">
                {cars.length} voiture{cars.length !== 1 ? "s" : ""} sur ta liste
              </p>
            )}
          </div>

          {loading ? (
            <LoadingState />
          ) : cars.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden group"
                >
                  <Link to={`/cars/${car.id}`}>
                    {car.image_url ? (
                      <img src={car.image_url} alt={`${car.make} ${car.model}`} className="w-full aspect-video object-cover" />
                    ) : (
                      <div className="w-full aspect-video bg-slate-950/60 flex items-center justify-center">
                        <Car className="w-10 h-10 text-slate-700" />
                      </div>
                    )}
                  </Link>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/cars/${car.id}`} className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-lg uppercase tracking-wide text-white leading-tight truncate">
                          {car.make} {car.model}
                        </p>
                        {car.year && <p className="text-xs font-mono text-slate-600">{car.year}</p>}
                      </Link>
                      {car.car_class && <ClassBadge carClass={car.car_class} pi={car.pi} size="sm" />}
                    </div>
                    <button
                      onClick={() => removeFromWishlist(car.id)}
                      className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-3 py-2 text-xs font-bold text-slate-400 transition-colors"
                    >
                      Retirer de la liste
                    </button>
                  </div>
                </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden animate-pulse">
          <div className="w-full aspect-video bg-slate-800/60" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-800 rounded w-3/4" />
            <div className="h-8 bg-slate-800/60 rounded-xl" />
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
        <ListChecks className="w-7 h-7 text-slate-600" />
      </div>
      <p className="font-heading font-bold text-xl uppercase text-slate-500">Wishlist vide</p>
      <p className="text-sm text-slate-600 max-w-xs">Marque des voitures comme "Voulue" dans le catalogue pour les retrouver ici.</p>
      <Link to="/catalogue" className="mt-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-sm font-bold transition-colors">
        Parcourir le catalogue
      </Link>
    </div>
  );
}
