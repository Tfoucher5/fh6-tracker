import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Save, UserRound, Eye, EyeOff } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xbox_gamertag: string | null;
  is_public: boolean;
  bio: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setMessage("");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      window.location.href = "/auth";
      return;
    }

    setUser(userData.user);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, xbox_gamertag, is_public, bio")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      const fallbackUsername =
        userData.user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") ||
        "user";

      const { data: insertedProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userData.user.id,
          username: `${fallbackUsername}_${userData.user.id.slice(0, 8)}`,
          display_name: fallbackUsername,
        })
        .select("id, username, display_name, avatar_url, xbox_gamertag, is_public, bio")
        .single();

      if (insertError) {
        setMessage(insertError.message);
        setLoading(false);
        return;
      }

      setProfile(insertedProfile);
    } else {
      setProfile(data);
    }

    setLoading(false);
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    if (!profile) return;

    setProfile({
      ...profile,
      [key]: value,
    });
  }

  async function saveProfile() {
    if (!profile || !user) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        username: profile.username,
        display_name: profile.display_name,
        xbox_gamertag: profile.xbox_gamertag,
        is_public: profile.is_public,
        bio: profile.bio,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profil sauvegardé.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Chargement du profil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Profil introuvable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-red-400">
              FH6 Tracker
            </p>
            <h1 className="text-4xl font-bold mt-2">Mon profil</h1>
            <p className="text-slate-400 mt-2">
              Gère ton identité, ton gamertag et la visibilité de ton profil.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
            <UserRound className="w-8 h-8 text-red-300" />
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Username</label>
            <input
              value={profile.username}
              onChange={(e) => updateField("username", e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
              placeholder="theoracer"
            />
            <p className="text-xs text-slate-500">
              3 à 32 caractères. Lettres, chiffres et underscore uniquement.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Nom affiché</label>
            <input
              value={profile.display_name ?? ""}
              onChange={(e) => updateField("display_name", e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
              placeholder="Theo"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Gamertag Xbox</label>
            <input
              value={profile.xbox_gamertag ?? ""}
              onChange={(e) => updateField("xbox_gamertag", e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500"
              placeholder="Ton gamertag"
            />
            <p className="text-xs text-slate-500">
              Si ton profil est privé, le gamertag ne sera pas affiché publiquement.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Bio</label>
            <textarea
              value={profile.bio ?? ""}
              onChange={(e) => updateField("bio", e.target.value)}
              className="w-full min-h-28 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-red-500 resize-none"
              placeholder="Fan de Forza, collectionneur, photographe Horizon Promo..."
            />
          </div>

          <button
            type="button"
            onClick={() => updateField("is_public", !profile.is_public)}
            className={`w-full rounded-xl px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-colors ${
              profile.is_public
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-slate-800 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            {profile.is_public ? (
              <>
                <Eye className="w-5 h-5" />
                Profil public
              </>
            ) : (
              <>
                <EyeOff className="w-5 h-5" />
                Profil privé
              </>
            )}
          </button>

          {message && (
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-3 text-sm text-slate-300">
              {message}
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}