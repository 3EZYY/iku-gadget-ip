// supabase/functions/create-internal-user/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, password, fullName, role } = await req.json();

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "Email, password, and role are required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase Admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user via Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        created_by_admin: "true"
      }
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const user = data.user;

    // Explicitly insert into profiles and user_roles using the service-role client.
    // This is intentionally redundant with the handle_new_user trigger —
    // it guarantees the rows exist even if the trigger fails or races.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        [{ id: user.id, full_name: fullName ?? email, email: email, is_approved: true }],
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("[create-internal-user] profiles upsert error:", profileError.message);
      // Non-fatal — trigger may have already inserted; log and continue
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        [{ user_id: user.id, role: role }],
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      // Role insert failure IS fatal — without a role the user can't log in
      return new Response(JSON.stringify({ error: `Akun dibuat tapi gagal menetapkan role: ${roleError.message}` }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
