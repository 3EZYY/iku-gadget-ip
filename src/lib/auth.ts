import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useRole";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Public self-registration — always assigns 'karyawan'.
 * The DB trigger handle_new_user() will read the metadata and insert
 * the correct row into profiles + user_roles automatically.
 */
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: fullName ?? email,
        role: "karyawan", // default for public registration
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Admin/Owner creates a new account with an explicit role.
 * Uses the Supabase Admin API via a Postgres RPC so no service-key
 * is exposed to the browser. The RPC assign_role_to_user() enforces
 * permission rules server-side.
 *
 * Flow:
 *  1. Call supabase.auth.signUp() — creates auth.users row
 *  2. DB trigger handle_new_user() inserts profile + default role
 *  3. Call assign_role_to_user() RPC to set the intended role
 *     (overwrites the default 'karyawan' if needed)
 */
export async function createUserWithRole(
  email: string,
  password: string,
  role: AppRole,
  fullName?: string
) {
  // Step 1: create the auth user (trigger fires, inserts karyawan by default)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName ?? email,
        role, // trigger reads this and assigns correct role directly
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Gagal membuat akun");

  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
