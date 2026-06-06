import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gauge, AtSign } from "lucide-react";
import { supabase } from "../lib/supabase";

function validateUsername(value: string) {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

export default function SetupProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/feed";

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = validateUsername(username);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { error: upsertError } = await supabase
      .from("profiles")
      .update({ username, needs_username_setup: false })
      .eq("id", user.id);

    if (upsertError) {
      setError(
        upsertError.message.includes("unique")
          ? "Ce pseudo est déjà pris. Choisis-en un autre."
          : upsertError.message
      );
      setLoading(false);
      return;
    }

    navigate(returnTo, { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/25 mb-4">
            <Gauge className="w-7 h-7 text-red-400" />
          </div>
          <p className="font-heading text-xs font-bold uppercase tracking-[0.35em] text-red-500 mb-2">
            FH6 Tracker
          </p>
          <h1 className="font-heading font-black text-3xl uppercase tracking-wide text-white">
            Choisis ton pseudo
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            C'est ton identifiant unique sur FH6 Tracker. Tu ne pourras pas le changer.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl shadow-black/40"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Pseudo
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 pl-10 pr-4 py-3 text-sm outline-none focus:border-red-500/70 transition-colors"
                placeholder="monpseudo"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-600">
              3 à 20 caractères — lettres minuscules, chiffres et _ uniquement.
            </p>
            {username.length >= 3 && (
              <p className={`text-xs ${isValid ? "text-emerald-400" : "text-red-400"}`}>
                {isValid ? `✓ @${username} est disponible` : "✗ Format invalide"}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            disabled={loading || !isValid}
            className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-3 font-bold text-sm transition-colors"
          >
            {loading ? "Enregistrement…" : "Continuer"}
          </button>
        </form>
      </div>
    </div>
  );
}
