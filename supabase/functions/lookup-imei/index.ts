// supabase/functions/lookup-imei/index.ts
// Smart IMEI Lookup — API Router with fallback + logging
// Primary: imei.org (Dhru) | Apple chain: ifreeicloud.co.uk | Fallback: imei.info
// Deploy: supabase functions deploy lookup-imei --no-verify-jwt
// Secrets: supabase secrets set IMEI_ORG_KEY=xxx IMEI_INFO_KEY=xxx IFREEICLOUD_KEY=xxx IMEI_ORG_USERNAME=xxx

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

// ─── Environment ─────────────────────────────────────────────
function getEnv(key: string, fallback = ""): string {
  return Deno.env.get(key) ?? fallback;
}

// ─── Primary: imei.org (Dhru Fusion API) ──────────────────────
async function fetchImeiOrg(imei: string): Promise<Record<string, unknown> | null> {
  const username = getEnv("IMEI_ORG_USERNAME");
  const apiKey = getEnv("IMEI_ORG_KEY");

  if (!apiKey || !username) {
    console.log("[imei.org] Skipped — IMEI_ORG_KEY or IMEI_ORG_USERNAME not set");
    return { __error: "IMEI_ORG_KEY or IMEI_ORG_USERNAME not configured in Supabase secrets" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    // Dhru Fusion API format
    const payload = {
      username: username,
      apiaccesskey: apiKey,
      action: "imeimakemodel",
      parameters: {
        imei: imei,
      },
    };

    console.log("[imei.org] Requesting with action: imeimakemodel, IMEI:", imei);

    const res = await fetch("https://api-client.imei.org/api/dhru", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("[imei.org] HTTP Status:", res.status);

    const rawText = await res.text();
    console.log("[imei.org] Raw Response:", rawText.substring(0, 500));

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${rawText.substring(0, 200)}`);
    }

    const data = JSON.parse(rawText);

    // Check for internal API errors
    if (data?.error || data?.status === "error" || data?.success === false || data?.ERROR) {
      const errMsg = data.error || data.ERROR || data.message || "Unknown API error";
      console.log("[imei.org] API returned error:", errMsg);
      throw new Error(errMsg);
    }

    console.log("[imei.org] Success — brand:", data.brand || data.Brand || "?");
    return data;
  } catch (err) {
    console.error("[imei.org] Failed:", (err as Error).message);
    return { __error: (err as Error).message };
  }
}

// ─── Fallback: imei.info ──────────────────────────────────────
async function fetchImeiInfo(imei: string): Promise<Record<string, unknown> | null> {
  const apiKey = getEnv("IMEI_INFO_KEY");

  if (!apiKey) {
    console.log("[imei.info] Skipped — IMEI_INFO_KEY not set");
    return { __error: "IMEI_INFO_KEY not configured in Supabase secrets" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    console.log("[imei.info] Requesting IMEI:", imei);

    const res = await fetch(`https://api.imei.info/api/check/${imei}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("[imei.info] HTTP Status:", res.status);

    const rawText = await res.text();
    console.log("[imei.info] Raw Response:", rawText.substring(0, 500));

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${rawText.substring(0, 200)}`);
    }

    const data = JSON.parse(rawText);

    if (data?.error || data?.success === false) {
      const errMsg = data.error || data.message || "Unknown error";
      console.log("[imei.info] API returned error:", errMsg);
      throw new Error(errMsg);
    }

    console.log("[imei.info] Success — brand:", data.brand || data.Brand || "?");
    return data;
  } catch (err) {
    console.error("[imei.info] Failed:", (err as Error).message);
    return { __error: (err as Error).message };
  }
}

// ─── Apple Chain: ifreeicloud.co.uk (Dhru format) ─────────────
async function fetchAppleStatus(imei: string): Promise<Record<string, unknown> | null> {
  const username = getEnv("IFREEICLOUD_USERNAME", "fadlynoiz");
  const apiKey = getEnv("IFREEICLOUD_KEY");

  if (!apiKey) {
    console.log("[ifreeicloud] Skipped — IFREEICLOUD_KEY not set");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // Apple checks can be slow

    // Dhru Fusion format for ifreeicloud
    const payload = {
      username: username,
      apiaccesskey: apiKey,
      action: "order",
      parameters: {
        imei: imei,
        service: "fmi_check",
      },
    };

    console.log("[ifreeicloud] Requesting FMI check for IMEI:", imei);

    const res = await fetch("https://api.ifreeicloud.co.uk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("[ifreeicloud] HTTP Status:", res.status);

    const rawText = await res.text();
    console.log("[ifreeicloud] Raw Response:", rawText.substring(0, 500));

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${rawText.substring(0, 200)}`);
    }

    const data = JSON.parse(rawText);

    if (data?.error || data?.success === false || data?.ERROR) {
      const errMsg = data.error || data.ERROR || data.message || "Unknown error";
      console.log("[ifreeicloud] API returned error:", errMsg);
      return null; // Don't throw — Apple check is optional
    }

    console.log("[ifreeicloud] Success");
    return data;
  } catch (err) {
    console.error("[ifreeicloud] Failed:", (err as Error).message);
    return null;
  }
}

// ─── Parse brand/model from various API responses ─────────────
function extractBrandModel(data: Record<string, unknown>): { brand: string; model: string } {
  const brand = String(
    data.brand ?? data.Brand ?? data.manufacturer ?? data.device_brand ?? data.BRAND ?? "Unknown"
  ).trim();
  const model = String(
    data.model ?? data.Model ?? data.model_name ?? data.device_model ?? data.MODEL ?? data.marketing_name ?? "Unknown"
  ).trim();
  return { brand, model };
}

function isAppleBrand(brand: string): boolean {
  const lower = brand.toLowerCase();
  return lower.includes("apple") || lower.includes("iphone") || lower.includes("ipad");
}

// ─── TAC Fallback Database (subset for offline) ───────────────
const TAC_FALLBACK: Record<string, { brand: string; model: string }> = {
  "35299511": { brand: "Apple", model: "iPhone 15 Pro Max" },
  "35299411": { brand: "Apple", model: "iPhone 15 Pro" },
  "35299311": { brand: "Apple", model: "iPhone 15 Plus" },
  "35299211": { brand: "Apple", model: "iPhone 15" },
  "35299111": { brand: "Apple", model: "iPhone 14 Pro Max" },
  "35298911": { brand: "Apple", model: "iPhone 14 Pro" },
  "35298411": { brand: "Apple", model: "iPhone 13" },
  "35298611": { brand: "Apple", model: "iPhone 13 Pro Max" },
  "35297511": { brand: "Apple", model: "iPhone 11" },
  "35851511": { brand: "Samsung", model: "Galaxy S24 Ultra" },
  "35851211": { brand: "Samsung", model: "Galaxy S23 Ultra" },
  "35850811": { brand: "Samsung", model: "Galaxy S22 Ultra" },
  "35849811": { brand: "Samsung", model: "Galaxy A55" },
  "86800011": { brand: "Xiaomi", model: "14 Ultra" },
  "86799911": { brand: "Xiaomi", model: "14" },
  "86799511": { brand: "Redmi", model: "Note 13 Pro+" },
  "86799411": { brand: "Redmi", model: "Note 13 Pro" },
  "86799211": { brand: "POCO", model: "X6 Pro" },
};

// ─── Main Orchestrator ────────────────────────────────────────
async function lookupImei(imei: string): Promise<UnifiedResponse> {
  const tac = imei.substring(0, 8);
  let errorPrimary = "";
  let errorFallback = "";

  console.log("=== IMEI Lookup Start ===", imei, "TAC:", tac);

  // Step 1: Try primary API (imei.org)
  const primaryData = await fetchImeiOrg(imei);

  if (primaryData && !primaryData.__error) {
    const { brand, model } = extractBrandModel(primaryData);
    const isApple = isAppleBrand(brand);

    let appleStatus: Record<string, unknown> | null = null;
    if (isApple) {
      appleStatus = await fetchAppleStatus(imei);
    }

    console.log("=== Result: imei.org success ===", brand, model);
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

  if (primaryData?.__error) {
    errorPrimary = String(primaryData.__error);
  } else {
    errorPrimary = "No response or connection failed";
  }

  // Step 2: Fallback to imei.info
  const fallbackData = await fetchImeiInfo(imei);

  if (fallbackData && !fallbackData.__error) {
    const { brand, model } = extractBrandModel(fallbackData);
    const isApple = isAppleBrand(brand);

    let appleStatus: Record<string, unknown> | null = null;
    if (isApple) {
      appleStatus = await fetchAppleStatus(imei);
    }

    console.log("=== Result: imei.info fallback success ===", brand, model);
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

  if (fallbackData?.__error) {
    errorFallback = String(fallbackData.__error);
  } else {
    errorFallback = "No response or connection failed";
  }

  // Step 3: Last resort — local TAC database
  const tacEntry = TAC_FALLBACK[tac];
  if (tacEntry) {
    const isApple = isAppleBrand(tacEntry.brand);
    console.log("=== Result: local TAC fallback ===", tacEntry.brand, tacEntry.model);
    return {
      success: true,
      is_apple: isApple,
      brand: tacEntry.brand,
      model: tacEntry.model,
      imei,
      tac,
      details: { source: "local_tac_db" },
      source: "local_tac",
      notes: "Data dari database lokal (API eksternal tidak tersedia). Informasi mungkin terbatas.",
    };
  }

  // All failed — return errors for debugging
  console.log("=== Result: ALL SOURCES FAILED ===");
  console.log("Primary error:", errorPrimary);
  console.log("Fallback error:", errorFallback);

  return {
    success: false,
    is_apple: false,
    brand: "Tidak Diketahui",
    model: `TAC: ${tac}`,
    imei,
    tac,
    details: {
      error_primary: errorPrimary,
      error_fallback: errorFallback,
    },
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
    console.error("[lookup-imei] Unhandled error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
