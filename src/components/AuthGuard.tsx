import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AuthGuard() {
  const [status, setStatus] = useState<"loading" | "auth" | "anon">("loading");
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setStatus(user ? "auth" : "anon");
    });
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

  return <Outlet />;
}
