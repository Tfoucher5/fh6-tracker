import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BannedPage from "../pages/BannedPage";

export function StatusGate({ children }: { children: React.ReactNode }) {
  const [banned, setBanned] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkStatus(userId: string | null) {
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", userId)
        .single();
      if (mounted && data?.account_status === "banned") setBanned(true);
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      checkStatus(user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkStatus(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (banned) return <BannedPage />;
  return <>{children}</>;
}
