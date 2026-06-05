import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_ROLES = ["moderator", "admin", "owner"] as const;

export function useAdminRole(): string | null {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc("get_my_role").then(({ data }) => {
      if (data && (ADMIN_ROLES as readonly string[]).includes(data)) {
        setRole(data as string);
      }
    });
  }, []);

  return role;
}

export function isAdminRole(role: string | null): boolean {
  return role !== null && (ADMIN_ROLES as readonly string[]).includes(role);
}
