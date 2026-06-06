import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Gauge, AtSign } from "lucide-react";
import { supabase } from "../lib/supabase";

function validatePassword(password: string) {
  return {
    minLength: password.length >= 10,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function validateUsername(value: string) {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/feed";
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    document.title = mode === "login" ? "Connexion — FH6 Tracker" : "Inscription — FH6 Tracker";
  }, [mode]);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

  const passwordRules = useMemo(() => validatePassword(password), [password]);
  const passwordIsValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const usernameIsValid = validateUsername(username);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${returnTo}` },
    });
    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        if (!usernameIsValid) {
          setMessage("Le pseudo doit faire 3 à 20 caractères (lettres, chiffres, _).");
          return;
        }
        if (!passwordIsValid) {
          setMessage("Le mot de passe ne respecte pas les critères requis.");
          return;
        }
        if (!passwordsMatch) {
          setMessage("Les mots de passe ne correspondent pas.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (data.user) {
          await supabase
            .from("profiles")
            .upsert({ id: data.user.id, username }, { onConflict: "id" });
        }

        setMessage("Compte créé. Tu peux maintenant te connecter.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setUsername("");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.href = returnTo;
    } finally {
      setLoading(false);
    }
  }

  function RuleItem({ ok, label }: { ok: boolean; label: string }) {
    return (
      <li className={`flex items-center gap-2 ${ok ? "text-emerald-400" : "text-slate-500"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-slate-700"}`} />
        {label}
      </li>
    );
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
          <h1 className="font-heading font-black text-4xl uppercase tracking-wide text-white">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Gère ton garage FH6, ta collection et ton Horizon Promo.
          </p>
        </div>

        {/* Bouton Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-slate-100 disabled:opacity-50 px-4 py-3 font-semibold text-sm text-slate-900 transition-colors shadow-lg shadow-black/20 mb-4"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? "Redirection…" : "Continuer avec Google"}
        </button>

        {/* Séparateur */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600 font-semibold uppercase tracking-widest">ou</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl shadow-black/40"
        >
          {mode === "register" && (
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
                />
              </div>
              {username.length > 0 && (
                <p className={`text-xs ${usernameIsValid ? "text-emerald-400" : "text-slate-500"}`}>
                  {usernameIsValid ? `✓ @${username}` : "3 à 20 caractères — lettres, chiffres, _"}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 pl-10 pr-4 py-3 text-sm outline-none focus:border-red-500/70 transition-colors"
                placeholder="ton@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 pl-10 pr-11 py-3 text-sm outline-none focus:border-red-500/70 transition-colors"
                placeholder="••••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 pl-10 pr-11 py-3 text-sm outline-none focus:border-red-500/70 transition-colors"
                    placeholder="••••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}>
                    {passwordsMatch ? "✓ Les mots de passe correspondent." : "✗ Les mots de passe ne correspondent pas."}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-slate-800/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                  Sécurité
                </p>
                <ul className="text-xs space-y-1.5">
                  <RuleItem ok={passwordRules.minLength} label="10 caractères minimum" />
                  <RuleItem ok={passwordRules.lowercase} label="Une minuscule" />
                  <RuleItem ok={passwordRules.uppercase} label="Une majuscule" />
                  <RuleItem ok={passwordRules.number} label="Un chiffre" />
                  <RuleItem ok={passwordRules.special} label="Un caractère spécial" />
                </ul>
              </div>
            </>
          )}

          {message && (
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 text-xs text-slate-300">
              {message}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-3 font-bold text-sm transition-colors"
          >
            {loading
              ? "Chargement…"
              : mode === "login"
                ? "Se connecter"
                : "S'inscrire"}
          </button>

          <button
            type="button"
            className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
              setPassword("");
              setConfirmPassword("");
              setUsername("");
            }}
          >
            {mode === "login"
              ? "Pas encore de compte ? S'inscrire"
              : "Déjà un compte ? Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
