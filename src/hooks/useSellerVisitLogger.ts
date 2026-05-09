import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useRole } from "./useRole";

export function useSellerVisitLogger() {
  const { user } = useAuth();
  const { isKaryawan } = useRole();
  const logged = useRef(false);

  useEffect(() => {
    if (!user || !isKaryawan || logged.current) return;
    logged.current = true;

    supabase.from("seller_visits").insert({
      seller_user_id: user.id,
      seller_email: user.email || "unknown",
    });
  }, [user, isKaryawan]);
}
