import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "owner" | "admin" | "karyawan";

const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 600;

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole]           = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRole(null);
      setIsApproved(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRole = async (attempt = 1) => {
      try {
        // Fetch role and approval status in parallel
        const [roleRes, profileRes] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("is_approved")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        if (roleRes.error) {
          console.error(`[useRole] attempt ${attempt} error:`, roleRes.error.message);
          if (attempt < MAX_ATTEMPTS) {
            setTimeout(() => fetchRole(attempt + 1), RETRY_DELAY_MS * attempt);
            return;
          }
          setRole(null);
          setIsApproved(null);
          setLoading(false);
          return;
        }

        // Retry if role row not yet created by trigger
        if (roleRes.data === null && attempt < MAX_ATTEMPTS) {
          console.warn(`[useRole] no role found yet, retrying (${attempt}/${MAX_ATTEMPTS})...`);
          setTimeout(() => fetchRole(attempt + 1), RETRY_DELAY_MS * attempt);
          return;
        }

        setRole((roleRes.data?.role as AppRole) ?? null);
        // If profile row doesn't exist yet, treat as not approved
        setIsApproved(profileRes.data?.is_approved ?? false);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[useRole] unexpected error:", err);
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => fetchRole(attempt + 1), RETRY_DELAY_MS * attempt);
          return;
        }
        setRole(null);
        setIsApproved(null);
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
    isApproved,
    isOwner:    role === "owner",
    isAdmin:    role === "admin",
    isKaryawan: role === "karyawan",
    /** @deprecated use isKaryawan */
    isSeller:   role === "karyawan",
    loading,
  };
}
