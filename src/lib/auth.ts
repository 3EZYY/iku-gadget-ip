import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useRole";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Google OAuth sign-in.
 * Redirects to /dashboard after successful auth.
 * New Google users will have is_approved = false until Owner/Admin approves.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Public self-registration — always assigns 'karyawan', is_approved = false.
 * The DB trigger handle_new_user() reads metadata and inserts profiles + user_roles.
 */
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: fullName ?? email,
        role: "karyawan",
        // No created_by_admin flag → trigger sets is_approved = false
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Admin/Owner creates a new account with an explicit role.
 * Sets created_by_admin = true in metadata → trigger sets is_approved = true.
 */
export async function createUserWithRole(
  email: string,
  password: string,
  role: AppRole,
  fullName?: string
) {
  const { data, error } = await supabase.functions.invoke("create-internal-user", {
    body: { email, password, fullName, role },
  });

  if (error) {
    // FunctionsHttpError carries the raw Response in `.context`. Parse the JSON body
    // so the toast shows the actual reason (e.g. "Password too short") instead of
    // the generic "Edge Function returned a non-2xx status code".
    let actualMessage: string | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = await (error as any).context?.json?.();
      if (body?.error) actualMessage = String(body.error);
    } catch {
      // Body unreadable — fall through to generic handling
    }

    const msg = (actualMessage ?? error.message ?? "").toLowerCase();
    if (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).status === 429 ||
      msg.includes("rate limit") ||
      msg.includes("too many requests")
    ) {
      throw new Error("Terlalu banyak percobaan. Harap tunggu beberapa menit sebelum membuat akun baru.");
    }
    throw new Error(actualMessage ?? error.message ?? "Gagal membuat akun");
  }
  
  if (data?.error) {
    const errMsg = String(data.error).toLowerCase();
    if (errMsg.includes("rate limit") || errMsg.includes("too many requests")) {
      throw new Error("Terlalu banyak percobaan. Harap tunggu beberapa menit sebelum membuat akun baru.");
    }
    throw new Error(String(data.error));
  }

  if (!data?.user) throw new Error("Gagal membuat akun");
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
