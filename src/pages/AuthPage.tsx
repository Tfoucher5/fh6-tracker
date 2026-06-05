import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Gauge } from "lucide-react";
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

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/feed";
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    document.title = mode === "login" ? "Connexion — FH6 Tracker" : "Inscription — FH6 Tracker";
  }, [mode]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const passwordRules = useMemo(() => validatePassword(password), [password]);
  const passwordIsValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        if (!passwordIsValid) {
          setMessage("Le mot de passe ne respecte pas les critères requis.");
          return;
        }
        if (!passwordsMatch) {
          setMessage("Les mots de passe ne correspondent pas.");
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage("Compte créé. Tu peux maintenant te connecter.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
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

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl shadow-black/40"
        >
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
