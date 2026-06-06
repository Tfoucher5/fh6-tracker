import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Status = "loading" | "auth" | "anon" | "needs-profile";

export function AuthGuard() {
  const [status, setStatus] = useState<Status>("loading");
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus("anon"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("needs_username_setup")
        .eq("id", user.id)
        .single();

      setStatus(profile?.needs_username_setup ? "needs-profile" : "auth");
    })();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "anon") {
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (status === "needs-profile") {
    return <Navigate to={`/setup-profile?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}
