import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";

export default function BannedPage() {
  useEffect(() => { document.title = "Compte banni — FH6 Tracker"; }, []);
  return (
    <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-2">
            Accès refusé
          </p>
          <h1 className="font-heading font-black text-4xl uppercase tracking-wide text-white leading-none">
            Compte banni
          </h1>
          <p className="text-slate-400 mt-4 leading-relaxed">
            Ton compte n'a plus accès à FH6 Tracker suite à une violation des règles de la communauté.
          </p>
          <p className="text-slate-500 text-sm mt-3">
            Si tu penses qu'il s'agit d'une erreur, contacte l'administration.
          </p>
        </div>
        <Link
          to="/auth"
          className="inline-block text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Se connecter avec un autre compte
        </Link>
      </div>
    </div>
  );
}
