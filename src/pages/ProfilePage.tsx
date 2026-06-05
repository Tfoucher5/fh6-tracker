import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Save, UserRound, Eye, EyeOff, Users, ExternalLink, Upload, Link2, Camera, ImageIcon, Loader2, X, LogOut } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { UserAvatar } from "../features/social/components/UserAvatar";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  xbox_gamertag: string | null;
  is_public: boolean;
  bio: string | null;
};

type UploadMode = "file" | "url";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  const [avatarMode, setAvatarMode] = useState<UploadMode>("file");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [bannerMode, setBannerMode] = useState<UploadMode>("file");
  const [bannerUrlInput, setBannerUrlInput] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Mon profil — FH6 Tracker";
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { window.location.href = "/auth"; return; }
    setUser(userData.user);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, banner_url, xbox_gamertag, is_public, bio")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (error) { setMessage(error.message); setLoading(false); return; }

    const [{ count: fwers }, { count: fwing }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userData.user.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userData.user.id),
    ]);
    setFollowers(fwers ?? 0);
    setFollowing(fwing ?? 0);

    if (!data) {
      const fallback = userData.user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") || "user";
      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userData.user.id, username: `${fallback}_${userData.user.id.slice(0, 8)}`, display_name: fallback })
        .select("id, username, display_name, avatar_url, banner_url, xbox_gamertag, is_public, bio")
        .single();
      if (insertError) { setMessage(insertError.message); setLoading(false); return; }
      setProfile(inserted);
    } else {
      setProfile(data);
      if (data.avatar_url) setAvatarUrlInput(data.avatar_url);
      if (data.banner_url) setBannerUrlInput(data.banner_url);
    }
    setLoading(false);
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  }

  async function handleAvatarFile(file: File) {
    if (!user) return;
    setAvatarUploading(true);
    const path = `${user.id}/avatar`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setMessage(error.message); setAvatarUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl;
    updateField("avatar_url", url);
    setAvatarUrlInput(url);
    setAvatarUploading(false);
  }

  async function handleBannerFile(file: File) {
    if (!user) return;
    setBannerUploading(true);
    const path = `${user.id}/banner`;
    const { error } = await supabase.storage
      .from("banners")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setMessage(error.message); setBannerUploading(false); return; }
    const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
    const url = urlData.publicUrl;
    updateField("banner_url", url);
    setBannerUrlInput(url);
    setBannerUploading(false);
  }

  async function saveProfile() {
    if (!profile || !user) return;
    setSaving(true);
    setMessage("");

    // Apply URL inputs if in URL mode
    const finalAvatarUrl = avatarMode === "url" && avatarUrlInput.trim()
      ? avatarUrlInput.trim()
      : profile.avatar_url;
    const finalBannerUrl = bannerMode === "url" && bannerUrlInput.trim()
      ? bannerUrlInput.trim()
      : profile.banner_url;

    const { error } = await supabase
      .from("profiles")
      .update({
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: finalAvatarUrl,
        banner_url: finalBannerUrl,
        xbox_gamertag: profile.xbox_gamertag,
        is_public: profile.is_public,
        bio: profile.bio,
      })
      .eq("id", user.id);

    if (error) setMessage(error.message);
    else {
      setMessage("Profil sauvegardé !");
      if (finalAvatarUrl !== profile.avatar_url) updateField("avatar_url", finalAvatarUrl);
      if (finalBannerUrl !== profile.banner_url) updateField("banner_url", finalBannerUrl);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center">
        <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-400 animate-pulse">Chargement…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center">
        <p className="font-heading text-xl font-bold tracking-widest uppercase text-slate-500">Profil introuvable.</p>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">

          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">FH6 Tracker</p>
              <h1 className="font-heading font-black text-5xl uppercase tracking-wide text-white leading-none">Mon profil</h1>
              <p className="text-slate-400 mt-2">Gère ton identité, ton gamertag et la visibilité de ton profil.</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-red-600/15 border border-red-500/25 flex items-center justify-center shrink-0">
              <UserRound className="w-8 h-8 text-red-400" />
            </div>
          </header>

          {/* Stats + lien public */}
          <div className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-4">
            <div className="flex gap-6">
              <div>
                <p className="font-heading font-black text-2xl text-white">{followers}</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Users className="w-3 h-3" />
                  Abonnés
                </div>
              </div>
              <div>
                <p className="font-heading font-black text-2xl text-white">{following}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Abonnements</p>
              </div>
            </div>
            {profile.username && (
              <Link
                to={`/u/${profile.username}`}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-4 py-2 text-sm font-bold text-slate-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Voir mon profil public
              </Link>
            )}
          </div>

          {/* Photo de profil */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="font-heading font-bold text-lg uppercase tracking-wide flex items-center gap-2">
              <Camera className="w-5 h-5 text-red-400" />
              Photo de profil
            </h2>

            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="relative shrink-0">
                <UserAvatar
                  username={profile.username}
                  displayName={profile.display_name}
                  avatarUrl={profile.avatar_url}
                  size="xl"
                />
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <ModeToggle mode={avatarMode} onChange={setAvatarMode} />

                {avatarMode === "file" ? (
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value = ""; }}
                    />
                    <DropZone
                      uploading={avatarUploading}
                      onClick={() => avatarInputRef.current?.click()}
                      onDrop={(f) => handleAvatarFile(f)}
                    />
                    <p className="text-[10px] text-slate-600 mt-1.5">JPG, PNG, GIF, WebP · max 5 Mo</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      onBlur={() => { if (avatarUrlInput.trim()) updateField("avatar_url", avatarUrlInput.trim()); }}
                      placeholder="https://…"
                      className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700/60 px-3 py-2.5 text-sm outline-none focus:border-red-500/70 transition-colors"
                    />
                  </div>
                )}

                {profile.avatar_url && (
                  <button
                    onClick={() => { updateField("avatar_url", null); setAvatarUrlInput(""); }}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Supprimer la photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bannière de profil */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="font-heading font-bold text-lg uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-red-400" />
              Bannière de profil
            </h2>

            {/* Preview */}
            <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden bg-slate-800/60 border border-slate-700/40">
              {profile.banner_url ? (
                <img src={profile.banner_url} alt="Bannière" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="w-8 h-8 text-slate-700" />
                  <p className="text-xs text-slate-700 font-semibold uppercase tracking-widest">Aucune bannière</p>
                </div>
              )}
              {bannerUploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
              )}
            </div>

            <ModeToggle mode={bannerMode} onChange={setBannerMode} />

            {bannerMode === "file" ? (
              <div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerFile(f); e.target.value = ""; }}
                />
                <DropZone
                  uploading={bannerUploading}
                  onClick={() => bannerInputRef.current?.click()}
                  onDrop={(f) => handleBannerFile(f)}
                />
                <p className="text-[10px] text-slate-600 mt-1.5">JPG, PNG, GIF, WebP · max 10 Mo · Format paysage recommandé (3:1)</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={bannerUrlInput}
                  onChange={(e) => setBannerUrlInput(e.target.value)}
                  onBlur={() => { if (bannerUrlInput.trim()) updateField("banner_url", bannerUrlInput.trim()); }}
                  placeholder="https://…"
                  className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700/60 px-3 py-2.5 text-sm outline-none focus:border-red-500/70 transition-colors"
                />
              </div>
            )}

            {profile.banner_url && (
              <button
                onClick={() => { updateField("banner_url", null); setBannerUrlInput(""); }}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
                Supprimer la bannière
              </button>
            )}
          </div>

          {/* Champs du profil */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Username</label>
              <input
                value={profile.username}
                onChange={(e) => updateField("username", e.target.value)}
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-3 text-sm outline-none focus:border-red-500/70 transition-colors"
                placeholder="theoracer"
              />
              <p className="text-xs text-slate-500">3 à 32 caractères. Lettres, chiffres et underscore uniquement.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Nom affiché</label>
              <input
                value={profile.display_name ?? ""}
                onChange={(e) => updateField("display_name", e.target.value)}
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-3 text-sm outline-none focus:border-red-500/70 transition-colors"
                placeholder="Theo"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Gamertag Xbox</label>
              <input
                value={profile.xbox_gamertag ?? ""}
                onChange={(e) => updateField("xbox_gamertag", e.target.value)}
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-3 text-sm outline-none focus:border-red-500/70 transition-colors"
                placeholder="Ton gamertag"
              />
              <p className="text-xs text-slate-500">Affiché uniquement si ton profil est public.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Bio</label>
              <textarea
                value={profile.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                maxLength={200}
                className="w-full min-h-28 rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-3 text-sm outline-none focus:border-red-500/70 transition-colors resize-none"
                placeholder="Fan de Forza, collectionneur, photographe Horizon Promo…"
              />
              <p className="text-xs text-slate-600 text-right">{(profile.bio ?? "").length}/200</p>
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
                <><Eye className="w-5 h-5" />Profil public</>
              ) : (
                <><EyeOff className="w-5 h-5" />Profil privé</>
              )}
            </button>

            {message && (
              <div className={`rounded-xl border p-3 text-xs ${
                message.includes("sauvegardé")
                  ? "bg-emerald-900/20 border-emerald-700/40 text-emerald-300"
                  : "bg-slate-800/60 border-slate-700/60 text-slate-300"
              }`}>
                {message}
              </div>
            )}

            <button
              onClick={saveProfile}
              disabled={saving || avatarUploading || bannerUploading}
              className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {saving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>

          {/* Déconnexion */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-300">Déconnexion</p>
              <p className="text-xs text-slate-600 mt-0.5">Te déconnecter de FH6 Tracker sur cet appareil.</p>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-red-500/15 hover:border-red-500/30 border border-slate-700/60 px-4 py-2 text-sm font-bold text-slate-400 hover:text-red-300 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}

function ModeToggle({ mode, onChange }: { mode: UploadMode; onChange: (m: UploadMode) => void }) {
  return (
    <div className="flex gap-1 bg-slate-950/60 rounded-xl p-1 w-fit">
      <button
        onClick={() => onChange("file")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === "file" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
      >
        <Upload className="w-3 h-3" />
        Fichier
      </button>
      <button
        onClick={() => onChange("url")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === "url" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
      >
        <Link2 className="w-3 h-3" />
        URL
      </button>
    </div>
  );
}

function DropZone({ uploading, onClick, onDrop }: { uploading: boolean; onClick: () => void; onDrop: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith("image/")) onDrop(f);
      }}
      className={`flex items-center justify-center gap-2 rounded-xl border border-dashed cursor-pointer px-4 py-4 text-sm transition-colors select-none ${
        dragging
          ? "border-red-500/70 bg-red-500/10 text-red-400"
          : "border-slate-700 hover:border-red-500/40 bg-slate-800/40 hover:bg-slate-800/70 text-slate-400 hover:text-white"
      } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {uploading ? (
        <><Loader2 className="w-4 h-4 animate-spin" />Téléchargement…</>
      ) : (
        <><Upload className="w-4 h-4" />{dragging ? "Dépose ici" : "Cliquer ou glisser-déposer"}</>
      )}
    </div>
  );
}
