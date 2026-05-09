import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Start as true — stay true until getSession() resolves
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialised = false;

    // 1. Resolve the persisted session first (synchronous-ish from localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      initialised = true;
    });

    // 2. Subscribe to future auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Skip the first INITIAL_SESSION event if getSession already ran
        // to avoid a double-set that can briefly flash null
        setSession(session);
        setUser(session?.user ?? null);
        if (!initialised) {
          setLoading(false);
          initialised = true;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
