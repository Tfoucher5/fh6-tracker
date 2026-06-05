import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { supabase } from "../lib/supabase";

export function CommunityGuard() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setStatus("active"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", user.id)
        .single();
      setStatus(data?.account_status ?? "active");
    });
  }, []);

  if (status === null) return null;

  if (status === "suspended") {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
            <ShieldOff className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-amber-500 mb-2">
              Accès restreint
            </p>
            <h1 className="font-heading font-black text-3xl uppercase tracking-wide text-white leading-none">
              Compte suspendu
            </h1>
            <p className="text-slate-400 mt-4 leading-relaxed">
              Ton compte est temporairement suspendu. Tu peux toujours consulter
              ton garage et ta progression, mais les fonctionnalités communautaires
              sont désactivées.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              to="/"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/catalogue"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
