// supabase/functions/lookup-imei/index.ts
// Smart IMEI Lookup — API Router with fallback
// Primary: imei.org | Apple chain: ifreeicloud.co.uk | Fallback: imei.info
// Deploy: supabase functions deploy lookup-imei --no-verify-jwt
// Secrets: supabase secrets set IMEI_ORG_KEY=xxx IMEI_INFO_KEY=xxx IFREEICLOUD_KEY=xxx

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ────────────────────────────────────────────────────
interface LookupRequest {
  imei: string;
}

interface UnifiedResponse {
  success: boolean;
  is_apple: boolean;
  brand: string;
  model: string;
  imei: string;
  tac: string;
  details: Record<string, unknown>;
  apple_icloud_status?: Record<string, unknown>;
  source: string;
  notes?: string;
}

// ─── Luhn Validation ──────────────────────────────────────────
function luhnCheck(imei: string): boolean {
  const digits = imei.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = digits[i];
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return (10 - (sum % 10)) % 10 === digits[14];
}

// ─── API Keys from Environment ────────────────────────────────
function getEnv(key: string, fallback = ""): string {
  return Deno.env.get(key) ?? fallback;
}

// ─── Primary: imei.org (Dhru API) ─────────────────────────────
async function fetchImeiOrg(imei: string): Promise<Record<string, unknown> | null> {
  const apiKey = getEnv("IMEI_ORG_KEY");
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch("https://api-client.imei.org/api/dhru", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getservicedetails",
        clientid: apiKey,
        imei: imei,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.error || data?.status === "error") return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Fallback: imei.info ──────────────────────────────────────
async function fetchImeiInfo(imei: string): Promise<Record<string, unknown> | null> {
  const apiKey = getEnv("IMEI_INFO_KEY");
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`https://api.imei.info/api/check/${imei}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// ─── Apple Chain: ifreeicloud.co.uk ───────────────────────────
async function fetchAppleStatus(imei: string): Promise<Record<string, unknown> | null> {
  const username = getEnv("IFREEICLOUD_USERNAME", "fadlynoiz");
  const apiKey = getEnv("IFREEICLOUD_KEY");
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // Apple checks can be slow

    const res = await fetch("https://api.ifreeicloud.co.uk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "order",
        username: username,
        apiaccesskey: apiKey,
        imei: imei,
        service: "fmi_check", // Find My iPhone check
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.error) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Parse brand/model from various API responses ─────────────
function extractBrandModel(data: Record<string, unknown>): { brand: string; model: string } {
  // Try common field names across APIs
  const brand = String(
    data.brand ?? data.manufacturer ?? data.device_brand ?? data.Brand ?? "Unknown"
  ).trim();
  const model = String(
    data.model ?? data.model_name ?? data.device_model ?? data.Model ?? data.marketing_name ?? "Unknown"
  ).trim();
  return { brand, model };
}

function isAppleBrand(brand: string): boolean {
  const lower = brand.toLowerCase();
  return lower.includes("apple") || lower.includes("iphone") || lower.includes("ipad");
}

// ─── TAC Fallback Database (subset for offline) ───────────────
// Used only when ALL APIs fail
const TAC_FALLBACK: Record<string, { brand: string; model: string }> = {
  "35299511": { brand: "Apple", model: "iPhone 15 Pro Max" },
  "35299411": { brand: "Apple", model: "iPhone 15 Pro" },
  "35299211": { brand: "Apple", model: "iPhone 15" },
  "35851511": { brand: "Samsung", model: "Galaxy S24 Ultra" },
  "35851211": { brand: "Samsung", model: "Galaxy S23 Ultra" },
  "86799911": { brand: "Xiaomi", model: "Xiaomi 14" },
  "86799511": { brand: "Redmi", model: "Redmi Note 13 Pro+" },
};

// ─── Main Orchestrator ────────────────────────────────────────
async function lookupImei(imei: string): Promise<UnifiedResponse> {
  const tac = imei.substring(0, 8);

  // Step 1: Try primary API (imei.org)
  const primaryData = await fetchImeiOrg(imei);

  if (primaryData) {
    const { brand, model } = extractBrandModel(primaryData);
    const isApple = isAppleBrand(brand);

    let appleStatus: Record<string, unknown> | null = null;

    // Step 2: If Apple, chain to ifreeicloud
    if (isApple) {
      appleStatus = await fetchAppleStatus(imei);
    }

    return {
      success: true,
      is_apple: isApple,
      brand,
      model,
      imei,
      tac,
      details: primaryData,
      ...(appleStatus ? { apple_icloud_status: appleStatus } : {}),
      source: "imei.org",
    };
  }

  // Step 3: Fallback to imei.info
  const fallbackData = await fetchImeiInfo(imei);

  if (fallbackData) {
    const { brand, model } = extractBrandModel(fallbackData);
    const isApple = isAppleBrand(brand);

    let appleStatus: Record<string, unknown> | null = null;
    if (isApple) {
      appleStatus = await fetchAppleStatus(imei);
    }

    return {
      success: true,
      is_apple: isApple,
      brand,
      model,
      imei,
      tac,
      details: fallbackData,
      ...(appleStatus ? { apple_icloud_status: appleStatus } : {}),
      source: "imei.info",
    };
  }

  // Step 4: Last resort — local TAC database
  const tacEntry = TAC_FALLBACK[tac];
  if (tacEntry) {
    const isApple = isAppleBrand(tacEntry.brand);
    return {
      success: true,
      is_apple: isApple,
      brand: tacEntry.brand,
      model: tacEntry.model,
      imei,
      tac,
      details: { source: "local_tac_db" },
      source: "local_tac",
      notes: "Data dari database lokal (API tidak tersedia). Informasi mungkin terbatas.",
    };
  }

  // All failed
  return {
    success: false,
    is_apple: false,
    brand: "Tidak Diketahui",
    model: `TAC: ${tac}`,
    imei,
    tac,
    details: {},
    source: "none",
    notes: "Semua sumber data gagal. Cek manual di imei.kemenperin.go.id.",
  };
}

// ─── Deno HTTP Server ─────────────────────────────────────────
Deno.serve(async (req: Request) => {
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
    const body = await req.json() as LookupRequest;

    if (!body.imei || body.imei.length !== 15) {
      return new Response(
        JSON.stringify({ error: "IMEI harus 15 digit" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (!luhnCheck(body.imei)) {
      return new Response(
        JSON.stringify({ error: "IMEI tidak valid (gagal Luhn check)" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const result = await lookupImei(body.imei);

    return new Response(JSON.stringify(result), {
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
