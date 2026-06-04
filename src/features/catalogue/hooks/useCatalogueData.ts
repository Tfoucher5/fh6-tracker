import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type { CarRow, StatusMap, UserCarRow } from "../types";

type ToggleField = "owned" | "photographed" | "favorite";

export function useCatalogueData() {
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<CarRow[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [loading, setLoading] = useState(true);
  const [savingCarId, setSavingCarId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCatalogue();
  }, []);

  async function loadCatalogue() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    const { data: carsData, error: carsError } = await supabase
      .from("cars")
      .select(
        "id, source_key, make, model, year, car_type, car_class, pi, country, availability, dlc, image_url"
      )
      .order("make", { ascending: true })
      .order("model", { ascending: true });

    if (carsError) {
      setMessage(carsError.message);
      setLoading(false);
      return;
    }

    setCars((carsData ?? []) as CarRow[]);

    if (currentUser) {
      const { data: statusData, error: statusError } = await supabase
        .from("user_cars")
        .select(
          "user_id, car_id, owned, photographed, favorite, acquired_at, photographed_at"
        )
        .eq("user_id", currentUser.id);

      if (statusError) {
        setMessage(statusError.message);
        setLoading(false);
        return;
      }

      const map: StatusMap = {};

      for (const row of (statusData ?? []) as UserCarRow[]) {
        map[row.car_id] = row;
      }

      setStatuses(map);
    }

    setLoading(false);
  }

  function getStatus(carId: string): UserCarRow {
    return (
      statuses[carId] ?? {
        user_id: user?.id ?? "",
        car_id: carId,
        owned: false,
        photographed: false,
        favorite: false,
        acquired_at: null,
        photographed_at: null,
      }
    );
  }

  async function toggleStatus(carId: string, field: ToggleField) {
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    setSavingCarId(carId);
    setMessage("");

    const current = getStatus(carId);

    const next: UserCarRow = {
      ...current,
      user_id: user.id,
      car_id: carId,
      [field]: !current[field],
    };

    if (field === "owned") {
      next.acquired_at = next.owned
        ? current.acquired_at ?? new Date().toISOString()
        : null;
    }

    if (field === "photographed") {
      next.photographed_at = next.photographed
        ? current.photographed_at ?? new Date().toISOString()
        : null;
    }

    const { data, error } = await supabase
      .from("user_cars")
      .upsert(
        {
          user_id: user.id,
          car_id: carId,
          owned: next.owned,
          photographed: next.photographed,
          favorite: next.favorite,
          acquired_at: next.acquired_at,
          photographed_at: next.photographed_at,
        },
        {
          onConflict: "user_id,car_id",
        }
      )
      .select(
        "user_id, car_id, owned, photographed, favorite, acquired_at, photographed_at"
      )
      .single();

    if (error) {
      setMessage(error.message);
      setSavingCarId(null);
      return;
    }

    setStatuses((prev) => ({
      ...prev,
      [carId]: data as UserCarRow,
    }));

    setSavingCarId(null);
  }

  return {
    user,
    cars,
    statuses,
    loading,
    savingCarId,
    message,
    getStatus,
    toggleStatus,
  };
}