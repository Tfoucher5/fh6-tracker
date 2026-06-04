import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type { CarDetail, CarPhoto, UserCarDetail } from "../types";

type ToggleField = "owned" | "photographed" | "favorite" | "wanted";

export function useCarDetail(carId: string | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [car, setCar] = useState<CarDetail | null>(null);
  const [status, setStatus] = useState<UserCarDetail | null>(null);
  const [photos, setPhotos] = useState<CarPhoto[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (carId) {
      loadCarDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  function buildDefaultStatus(currentUser: User, id: string): UserCarDetail {
    return {
      user_id: currentUser.id,
      car_id: id,
      owned: false,
      photographed: false,
      favorite: false,
      wanted: false,
      notes: null,
      acquired_at: null,
      photographed_at: null,
    };
  }

  async function loadCarDetail() {
    if (!carId) return;

    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    if (!currentUser) {
      window.location.href = "/auth";
      return;
    }

    setUser(currentUser);

    const { data: carData, error: carError } = await supabase
      .from("cars")
      .select(
        "id, source_key, make, model, year, car_type, car_class, pi, country, availability, dlc, image_url, source_url"
      )
      .eq("id", carId)
      .single();

    if (carError) {
      setMessage(carError.message);
      setLoading(false);
      return;
    }

    setCar(carData as CarDetail);

    const { data: statusData, error: statusError } = await supabase
      .from("user_cars")
      .select(
        "user_id, car_id, owned, photographed, favorite, wanted, notes, acquired_at, photographed_at"
      )
      .eq("user_id", currentUser.id)
      .eq("car_id", carId)
      .maybeSingle();

    if (statusError) {
      setMessage(statusError.message);
      setLoading(false);
      return;
    }

    setStatus(
      statusData
        ? (statusData as UserCarDetail)
        : buildDefaultStatus(currentUser, carId)
    );

    await loadPhotos(carId, currentUser.id);

    setLoading(false);
  }

  async function loadPhotos(id: string, currentUserId: string) {
    const { data, error } = await supabase
      .from("car_photos")
      .select(
        "id, car_id, user_id, storage_path, image_url, caption, is_public, is_primary, created_at"
      )
      .eq("car_id", id)
      .or(`is_public.eq.true,user_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPhotos((data ?? []) as CarPhoto[]);
  }

  async function upsertStatus(nextStatus: UserCarDetail) {
    if (!user || !carId) return;

    const { data, error } = await supabase
      .from("user_cars")
      .upsert(
        {
          user_id: user.id,
          car_id: carId,
          owned: nextStatus.owned,
          photographed: nextStatus.photographed,
          favorite: nextStatus.favorite,
          wanted: nextStatus.wanted,
          notes: nextStatus.notes,
          acquired_at: nextStatus.acquired_at,
          photographed_at: nextStatus.photographed_at,
        },
        {
          onConflict: "user_id,car_id",
        }
      )
      .select(
        "user_id, car_id, owned, photographed, favorite, wanted, notes, acquired_at, photographed_at"
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    setStatus(data as UserCarDetail);
  }

  async function toggleStatus(field: ToggleField) {
    if (!user || !carId || !status) return;

    setSaving(true);
    setMessage("");

    try {
      const next: UserCarDetail = {
        ...status,
        [field]: !status[field],
      };

      if (field === "owned") {
        next.acquired_at = next.owned
          ? status.acquired_at ?? new Date().toISOString()
          : null;
      }

      if (field === "photographed") {
        next.photographed_at = next.photographed
          ? status.photographed_at ?? new Date().toISOString()
          : null;
      }

      await upsertStatus(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }

    setSaving(false);
  }

  async function saveNotes(notes: string) {
    if (!user || !carId || !status) return;

    setSaving(true);
    setMessage("");

    try {
      await upsertStatus({
        ...status,
        notes,
      });

      setMessage("Notes sauvegardées.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }

    setSaving(false);
  }

  async function uploadPhoto(file: File, caption: string, isPublic: boolean) {
    if (!user || !carId) return;

    setUploading(true);
    setMessage("");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeName = `${Date.now()}.${extension}`;
      const storagePath = `${user.id}/${carId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("car-photos")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("car-photos")
        .getPublicUrl(storagePath);

      const imageUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase.from("car_photos").insert({
        car_id: carId,
        user_id: user.id,
        storage_path: storagePath,
        image_url: imageUrl,
        caption: caption.trim() || null,
        is_public: isPublic,
        is_primary: false,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      await loadPhotos(carId, user.id);
      setMessage("Photo ajoutée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }

    setUploading(false);
  }

  async function deletePhoto(photo: CarPhoto) {
    if (!user || !carId) return;

    if (photo.user_id !== user.id) {
      setMessage("Tu ne peux supprimer que tes propres photos.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error: storageError } = await supabase.storage
        .from("car-photos")
        .remove([photo.storage_path]);

      if (storageError) {
        throw new Error(storageError.message);
      }

      const { error: dbError } = await supabase
        .from("car_photos")
        .delete()
        .eq("id", photo.id)
        .eq("user_id", user.id);

      if (dbError) {
        throw new Error(dbError.message);
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setMessage("Photo supprimée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }

    setSaving(false);
  }

  return {
    user,
    car,
    status,
    photos,
    loading,
    saving,
    uploading,
    message,
    toggleStatus,
    saveNotes,
    uploadPhoto,
    deletePhoto,
  };
}