import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "owner" | "admin" | "karyawan";

const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 600;

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole]       = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until auth is resolved before doing anything
    if (authLoading) return;

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRole = async (attempt = 1) => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error(`[useRole] attempt ${attempt} error:`, error.message);
          if (attempt < MAX_ATTEMPTS) {
            setTimeout(() => fetchRole(attempt + 1), RETRY_DELAY_MS * attempt);
            return;
          }
          setRole(null);
          setLoading(false);
          return;
        }

        // data is null → row not found yet (trigger may still be running)
        // retry a few times before giving up
        if (data === null && attempt < MAX_ATTEMPTS) {
          console.warn(`[useRole] no role found yet, retrying (${attempt}/${MAX_ATTEMPTS})...`);
          setTimeout(() => fetchRole(attempt + 1), RETRY_DELAY_MS * attempt);
          return;
        }

        setRole((data?.role as AppRole) ?? null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[useRole] unexpected error:", err);
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => fetchRole(attempt + 1), RETRY_DELAY_MS * attempt);
          return;
        }
        setRole(null);
        setLoading(false);
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return {
    role,
    isOwner:   role === "owner",
    isAdmin:   role === "admin",
    isKaryawan: role === "karyawan",
    /** @deprecated use isKaryawan */
    isSeller:  role === "karyawan",
    loading,
  };
}
