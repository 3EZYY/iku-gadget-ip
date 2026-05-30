// supabase/functions/ai-assistant/index.ts
// Gemini-powered AI chatbot with IP rate limiting
// Deploy: supabase functions deploy ai-assistant --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_REQUESTS_PER_HOUR = 15;
const SYSTEM_PROMPT = `Kamu adalah asisten virtual Iku Gadget & Stuff — toko jual beli HP bekas online terpercaya di Malang.

Informasi tentang Iku Gadget:
- Melayani jual beli HP bekas secara online via WhatsApp
- Proses: Chat → Negosiasi → COD (Cash on Delivery)
- Area COD: Malang dan sekitarnya
- Jam operasional: Senin-Sabtu 09.00-21.00 WIB
- Garansi fungsi 7 hari untuk setiap HP yang dijual
- Harga transparan, bisa dinegosiasi
- Tim: Anang, Lingga, Epo, Arya

Jawab pertanyaan customer dengan ramah, singkat, dan informatif dalam Bahasa Indonesia.
Jika ditanya hal di luar konteks toko, arahkan kembali ke topik jual beli HP bekas.`;

// ─── Rate Limiter ─────────────────────────────────────────────
async function checkRateLimit(supabaseAdmin: ReturnType<typeof createClient>, ip: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Count recent hits
  const { count } = await supabaseAdmin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("endpoint", "ai-assistant")
    .gte("hit_at", oneHourAgo);

  if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
    return false; // Rate limited
  }

  // Record this hit
  await supabaseAdmin.from("rate_limits").insert({
    ip_address: ip,
    endpoint: "ai-assistant",
  });

  // Cleanup old entries occasionally (1 in 10 chance)
  if (Math.random() < 0.1) {
    await supabaseAdmin.rpc("cleanup_rate_limits").catch(() => {});
  }

  return true;
}

// ─── Fetch Gemini API Key from DB ─────────────────────────────
async function getGeminiKey(supabaseAdmin: ReturnType<typeof createClient>): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("gemini_api_key")
    .limit(1)
    .maybeSingle();

  return data?.gemini_api_key || null;
}

// ─── Call Gemini API ──────────────────────────────────────────
async function callGemini(apiKey: string, userMessage: string, history: Array<{ role: string; text: string }>): Promise<string> {
  // Build conversation contents
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Halo! Saya asisten Iku Gadget & Stuff. Ada yang bisa saya bantu tentang jual beli HP bekas?" }] },
    ...history.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Gemini] Error:", res.status, errText.substring(0, 500));
    throw new Error(`HTTP ${res.status}: ${errText.substring(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

// ─── Server ───────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { message, history = [] } = await req.json() as {
      message: string;
      history?: Array<{ role: string; text: string }>;
    };

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "EMPTY_MESSAGE", details: "Pesan tidak boleh kosong" }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Verify env vars exist
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("[ai-assistant] Missing env:", { url: !!supabaseUrl, key: !!serviceKey });
      return new Response(JSON.stringify({
        error: "ENV_MISSING",
        details: `SUPABASE_URL: ${supabaseUrl ? "OK" : "MISSING"}, SERVICE_ROLE_KEY: ${serviceKey ? "OK" : "MISSING"}`,
      }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Create admin client (service role — bypasses ALL RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Get client IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    // Rate limit check
    const allowed = await checkRateLimit(supabaseAdmin, ip);
    if (!allowed) {
      return new Response(JSON.stringify({
        error: "RATE_LIMITED",
        details: "Terlalu banyak permintaan. Coba lagi dalam 1 jam.",
        rate_limited: true,
      }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Get API key from DB (using service role — bypasses owner-only RLS)
    let apiKey: string | null = null;
    try {
      const { data, error: dbErr } = await supabaseAdmin
        .from("site_settings")
        .select("gemini_api_key")
        .limit(1)
        .maybeSingle();

      if (dbErr) {
        console.error("[ai-assistant] DB error:", dbErr.message);
        return new Response(JSON.stringify({
          error: "DB_ERROR",
          details: dbErr.message,
        }), {
          status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      apiKey = data?.gemini_api_key || null;
    } catch (dbCatch) {
      return new Response(JSON.stringify({
        error: "DB_EXCEPTION",
        details: (dbCatch as Error).message,
      }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "NO_API_KEY",
        details: "Gemini API Key belum dikonfigurasi di site_settings. Owner harus set via AI Settings.",
      }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Call Gemini
    try {
      const reply = await callGemini(apiKey, message.trim(), history);
      return new Response(JSON.stringify({ reply }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    } catch (geminiErr) {
      return new Response(JSON.stringify({
        error: "GEMINI_ERROR",
        details: (geminiErr as Error).message,
      }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("[ai-assistant] Fatal:", (err as Error).message);
    return new Response(JSON.stringify({
      error: "FATAL",
      details: (err as Error).message,
    }), {
      status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
