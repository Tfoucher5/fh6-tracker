import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export type ChallengeCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url: string | null;
};

export type Challenge = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
  car_id: string | null;
  car: ChallengeCar | null;
  leaderboard_published: boolean;
  participant_count?: number;
  is_participating?: boolean;
};

const CHALLENGE_SELECT = `
  id, title, description, starts_at, ends_at, created_at, car_id, leaderboard_published,
  car:cars(id, make, model, year, image_url)
` as const;

export function useActiveChallenge(userId: string | null) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining] = useState(false);

  useEffect(() => { load(); }, [userId]);

  async function load() {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("challenges")
      .select(CHALLENGE_SELECT)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) { setChallenge(null); setLoading(false); return; }

    const ch = data as unknown as Challenge;

    // Compte les participants = posts avec car_id matching, dans la période
    let count = 0;
    if (ch.car_id) {
      const { count: c } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("car_id", ch.car_id)
        .eq("status", "published")
        .gte("created_at", ch.starts_at)
        .lte("created_at", ch.ends_at);
      count = c ?? 0;
    }

    // Vérifie si l'utilisateur courant a soumis une entrée
    let is_participating = false;
    if (userId && ch.car_id) {
      const { count: myCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("car_id", ch.car_id)
        .eq("user_id", userId)
        .eq("status", "published")
        .gte("created_at", ch.starts_at)
        .lte("created_at", ch.ends_at);
      is_participating = (myCount ?? 0) > 0;
    }

    setChallenge({ ...ch, participant_count: count, is_participating });
    setLoading(false);
  }

  // Pas de toggle join — participation auto via post
  return { challenge, loading, joining };
}
