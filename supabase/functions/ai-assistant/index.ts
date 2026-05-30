// supabase/functions/ai-assistant/index.ts
// Gemini 2.5 Flash AI Chatbot with static router + rate limiting
// Deploy: supabase functions deploy ai-assistant --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_REQUESTS_PER_HOUR = 15;

// ─── Static Response Router (Token Saver) ─────────────────────
// Matches EXACTLY with ChatAssistant.tsx quick topic buttons
const STATIC_RESPONSES: Record<string, string> = {
  "Apa itu Iku Gadget?":
    "Iku Gadget & Stuff adalah toko jual beli HP bekas online terpercaya yang beroperasi di area Malang dan sekitarnya. Kami menawarkan proses yang cepat via WhatsApp, harga transparan yang bisa dinegosiasi, dan garansi fungsi 7 hari untuk setiap perangkat yang kami jual. Tim kami (Anang, Lingga, Epo, Arya) siap melayani Senin–Sabtu pukul 09.00–21.00 WIB.",

  "Bisa COD di mana?":
    "Kami melayani COD (Cash on Delivery) di area Malang dan sekitarnya. Lokasi ketemuan bisa disepakati bersama — biasanya di tempat umum yang aman seperti mall, cafe, atau area kampus. Hubungi tim kami via WhatsApp untuk atur jadwal dan titik temu yang nyaman buat kamu!",

  "Apakah gadget bergaransi?":
    "Ya! Setiap HP bekas yang kami jual sudah melalui pengecekan menyeluruh dan dilengkapi garansi fungsi 7 hari. Jika dalam 7 hari ditemukan masalah fungsi (bukan kerusakan fisik akibat pemakaian), kami siap bertanggung jawab. Kami juga transparan soal kondisi unit — semua minus akan diinformasikan sebelum transaksi.",
};

// ─── System Instruction for Gemini ────────────────────────────
const SYSTEM_INSTRUCTION = `Kamu adalah AI Assistant resmi Iku Gadget & Stuff — toko jual beli HP bekas online terpercaya di Malang.

Konteks bisnis:
- Melayani jual beli HP bekas secara online via WhatsApp
- Proses: Chat → Negosiasi Harga → Ketemuan COD (Cash on Delivery)
- Area COD: Malang dan sekitarnya
- Jam operasional: Senin–Sabtu 09.00–21.00 WIB
- Garansi fungsi 7 hari untuk setiap HP yang dijual
- Harga transparan, bisa dinegosiasi langsung
- Tim: Anang (08817053043), Lingga (082142119783), Epo (082245070900), Arya (0882010490576)
- Tidak ada toko fisik — semua transaksi via WhatsApp + COD

Aturan menjawab:
- Jawab dalam Bahasa Indonesia yang ramah, singkat, dan profesional
- Jika ditanya harga spesifik, arahkan untuk chat WhatsApp karena harga berubah-ubah
- Jika ditanya hal di luar konteks jual beli gadget, jawab sopan bahwa kamu hanya bisa membantu seputar Iku Gadget
- Jangan pernah memberikan informasi palsu atau janji yang tidak bisa dipenuhi`;

// ─── Rate Limiter ─────────────────────────────────────────────
async function checkRateLimit(supabaseAdmin: ReturnType<typeof createClient>, ip: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabaseAdmin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("endpoint", "ai-assistant")
    .gte("hit_at", oneHourAgo);

  if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) return false;

  await supabaseAdmin.from("rate_limits").insert({ ip_address: ip, endpoint: "ai-assistant" });

  // Cleanup old entries occasionally
  if (Math.random() < 0.1) {
    await supabaseAdmin.rpc("cleanup_rate_limits").catch(() => {});
  }

  return true;
}

// ─── Server ───────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD", details: "POST only" }), {
      status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { message, history = [] } = await req.json() as {
      message: string;
      history?: Array<{ role: string; text: string }>;
    };

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "EMPTY", details: "Pesan kosong" }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const trimmed = message.trim();

    // ── Static Router: check predefined questions first ────────
    const staticReply = STATIC_RESPONSES[trimmed];
    if (staticReply) {
      console.log("[ai-assistant] Static response for:", trimmed);
      return new Response(JSON.stringify({ reply: staticReply }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── Dynamic: need Gemini API ───────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({
        error: "ENV_MISSING",
        details: `URL: ${supabaseUrl ? "OK" : "MISSING"}, KEY: ${serviceKey ? "OK" : "MISSING"}`,
      }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip") || "unknown";

    const allowed = await checkRateLimit(supabaseAdmin, ip);
    if (!allowed) {
      return new Response(JSON.stringify({
        error: "RATE_LIMITED",
        details: "Maks 15 pesan/jam. Coba lagi nanti.",
      }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Fetch Gemini key from DB (service role bypasses RLS)
    const { data: settings, error: dbErr } = await supabaseAdmin
      .from("site_settings")
      .select("gemini_api_key")
      .limit(1)
      .maybeSingle();

    if (dbErr) {
      return new Response(JSON.stringify({ error: "DB_ERROR", details: dbErr.message }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const geminiKey = settings?.gemini_api_key;
    if (!geminiKey) {
      return new Response(JSON.stringify({
        error: "NO_API_KEY",
        details: "Gemini API Key belum dikonfigurasi. Owner harus set via AI Settings.",
      }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── Call Gemini 2.5 Flash via @google/genai SDK ────────────
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // Build conversation history for context
    const contents = history.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    }));
    contents.push({ role: "user", parts: [{ text: trimmed }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.9,
      },
    });

    const reply = response.text || "Maaf, saya tidak bisa menjawab saat ini.";

    console.log("[ai-assistant] Gemini reply length:", reply.length);

    return new Response(JSON.stringify({ reply }), {
      status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
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
