import { useMemo, useState } from "react";
import { Eye, EyeOff, Mail, Lock, Gamepad2 } from "lucide-react";
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
  const [mode, setMode] = useState<"login" | "register">("login");
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
          options: {
            emailRedirectTo: window.location.origin,
          },
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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  function RuleItem({ ok, label }: { ok: boolean; label: string }) {
    return (
      <li className={ok ? "text-emerald-400" : "text-slate-500"}>
        {ok ? "✓" : "•"} {label}
      </li>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
      >
        <div>
          <div className="flex items-center gap-3 text-red-400">
            <Gamepad2 className="w-7 h-7" />
            <p className="text-sm uppercase tracking-[0.25em] font-semibold">
              FH6 Tracker
            </p>
          </div>

          <h1 className="text-3xl font-bold mt-4">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </h1>

          <p className="text-slate-400 mt-2">
            Gère ton garage FH6, ta collection et ton Horizon Promo.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-11 pr-4 py-3 outline-none focus:border-red-500"
              placeholder="ton@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-11 pr-12 py-3 outline-none focus:border-red-500"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mode === "register" && (
          <>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-11 pr-12 py-3 outline-none focus:border-red-500"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p className={passwordsMatch ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
                  {passwordsMatch ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas."}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-sm font-semibold text-slate-300 mb-2">
                Sécurité du mot de passe
              </p>

              <ul className="text-sm space-y-1">
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
          <div className="rounded-xl bg-slate-800 border border-slate-700 p-3 text-sm text-slate-300">
            {message}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 px-4 py-3 font-semibold transition-colors"
        >
          {loading
            ? "Chargement..."
            : mode === "login"
              ? "Se connecter"
              : "S'inscrire"}
        </button>

        <button
          type="button"
          className="w-full text-sm text-slate-400 hover:text-white"
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
  );
}