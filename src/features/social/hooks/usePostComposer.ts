import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { CarSearchResult, FeedPost } from "../types";

const POST_SELECT = `
  id, user_id, car_id, photo_url, storage_path, caption, created_at,
  profile:profiles!posts_user_id_fkey(id, username, display_name, avatar_url),
  car:cars(id, make, model, year, car_class, pi, image_url),
  post_likes(user_id),
  post_comments(id)
` as const;

export function usePostComposer(onSuccess: (post: FeedPost) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [carQuery, setCarQuery] = useState("");
  const [carResults, setCarResults] = useState<CarSearchResult[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarSearchResult | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (carQuery.trim().length < 2) {
      setCarResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("cars")
        .select("id, make, model, year, car_class, pi, image_url")
        .or(`make.ilike.%${carQuery}%,model.ilike.%${carQuery}%`)
        .limit(8);
      setCarResults((data ?? []) as CarSearchResult[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [carQuery]);

  function handleFileChange(f: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      previewUrlRef.current = url;
    } else {
      setPreviewUrl(null);
      previewUrlRef.current = null;
    }
  }

  function openWithCar(car: CarSearchResult) {
    setSelectedCar(car);
    setCarQuery(`${car.make} ${car.model}`);
    setIsOpen(true);
  }

  async function submit() {
    if (!file && !selectedCar) {
      setMessage("Ajoute une photo ou sélectionne une voiture.");
      return;
    }
    setSubmitting(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      let photoUrl: string | null = null;
      let storagePath: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("post-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
        storagePath = path;
      }

      const { data: postData, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          car_id: selectedCar?.id ?? null,
          photo_url: photoUrl,
          storage_path: storagePath,
          caption: caption.trim() || null,
        })
        .select(POST_SELECT)
        .single();

      if (insertError) throw new Error(insertError.message);

      onSuccess(postData as unknown as FeedPost);
      reset();
      setIsOpen(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    }

    setSubmitting(false);
  }

  function reset() {
    handleFileChange(null);
    setCarQuery("");
    setCarResults([]);
    setSelectedCar(null);
    setCaption("");
    setMessage("");
  }

  return {
    isOpen, setIsOpen,
    file, previewUrl, handleFileChange,
    carQuery, setCarQuery, carResults,
    selectedCar, setSelectedCar,
    caption, setCaption,
    submitting, message,
    submit, reset, openWithCar,
  };
}
