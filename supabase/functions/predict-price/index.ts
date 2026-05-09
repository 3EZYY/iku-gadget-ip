// supabase/functions/predict-price/index.ts
// Heuristic price prediction for used gadgets (Indonesian market)
// Deploy: supabase functions deploy predict-price --no-verify-jwt

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ────────────────────────────────────────────────────
interface PredictRequest {
  brand: string;
  model: string;
  year?: number;
  ram?: number;       // GB
  storage?: number;   // GB
  batteryHealth?: number; // %
  condition: string;  // "Like New 99%" | "Mulus 90%" | "Normal 80%" | etc.
}

interface PredictResponse {
  estimatedBuyPrice: number;
  estimatedSellPrice: number;
  estimatedProfit: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  tips: string[];
}

// ─── Base price table (IDR) ───────────────────────────────────
// Rough market reference for Indonesian used gadget market (2024-2025)
const BASE_PRICES: Record<string, Record<string, number>> = {
  iphone: {
    "15 pro max": 17_000_000,
    "15 pro": 14_500_000,
    "15 plus": 12_000_000,
    "15": 11_000_000,
    "14 pro max": 14_000_000,
    "14 pro": 11_500_000,
    "14 plus": 9_500_000,
    "14": 8_500_000,
    "13 pro max": 11_000_000,
    "13 pro": 9_000_000,
    "13": 7_500_000,
    "13 mini": 6_500_000,
    "12 pro max": 8_500_000,
    "12 pro": 7_000_000,
    "12": 5_500_000,
    "12 mini": 4_800_000,
    "11 pro max": 6_500_000,
    "11 pro": 5_500_000,
    "11": 4_500_000,
    "xr": 3_500_000,
    "xs max": 3_800_000,
    "xs": 3_200_000,
    "x": 2_800_000,
    "se 2022": 3_500_000,
    "se 2020": 2_500_000,
  },
  samsung: {
    "s24 ultra": 16_000_000,
    "s24+": 12_000_000,
    "s24": 10_000_000,
    "s23 ultra": 12_000_000,
    "s23+": 9_000_000,
    "s23": 7_500_000,
    "s22 ultra": 9_500_000,
    "s22+": 7_000_000,
    "s22": 5_500_000,
    "s21 ultra": 7_500_000,
    "s21+": 5_500_000,
    "s21": 4_500_000,
    "a55": 4_500_000,
    "a54": 3_800_000,
    "a53": 3_200_000,
    "a35": 3_500_000,
    "a34": 3_000_000,
    "a33": 2_500_000,
    "a25": 2_800_000,
    "a24": 2_300_000,
    "a15": 2_000_000,
    "a14": 1_800_000,
    "z fold 5": 18_000_000,
    "z fold 4": 14_000_000,
    "z flip 5": 9_000_000,
    "z flip 4": 7_000_000,
  },
  xiaomi: {
    "14 ultra": 12_000_000,
    "14": 8_000_000,
    "13 ultra": 10_000_000,
    "13": 6_500_000,
    "13t pro": 6_000_000,
    "13t": 5_000_000,
    "12 ultra": 8_000_000,
    "12 pro": 6_000_000,
    "12": 4_500_000,
    "redmi note 13 pro+": 4_500_000,
    "redmi note 13 pro": 3_800_000,
    "redmi note 13": 2_800_000,
    "redmi note 12 pro+": 3_500_000,
    "redmi note 12 pro": 3_000_000,
    "redmi note 12": 2_200_000,
    "poco x6 pro": 4_500_000,
    "poco x6": 3_500_000,
    "poco x5 pro": 3_200_000,
    "poco f5": 4_000_000,
    "poco f4": 3_500_000,
  },
  oppo: {
    "find x7 ultra": 12_000_000,
    "find x7": 9_000_000,
    "find x6 pro": 10_000_000,
    "reno 11 pro": 5_500_000,
    "reno 11": 4_500_000,
    "reno 10 pro+": 5_000_000,
    "reno 10 pro": 4_200_000,
    "reno 10": 3_500_000,
    "reno 8 pro": 4_000_000,
    "reno 8": 3_200_000,
    "a98": 3_500_000,
    "a78": 2_800_000,
    "a58": 2_200_000,
    "a38": 1_800_000,
  },
  vivo: {
    "x100 pro": 11_000_000,
    "x100": 8_500_000,
    "x90 pro": 9_000_000,
    "x90": 7_000_000,
    "v30 pro": 5_500_000,
    "v30": 4_500_000,
    "v29 pro": 4_800_000,
    "v29": 4_000_000,
    "v27 pro": 4_200_000,
    "v27": 3_500_000,
    "y100": 3_000_000,
    "y78": 2_500_000,
    "y36": 2_000_000,
    "y27": 1_800_000,
  },
  realme: {
    "gt 5 pro": 7_000_000,
    "gt 5": 5_500_000,
    "gt neo 5": 5_000_000,
    "11 pro+": 4_500_000,
    "11 pro": 3_800_000,
    "11": 3_000_000,
    "10 pro+": 4_000_000,
    "10 pro": 3_200_000,
    "10": 2_500_000,
    "c55": 2_200_000,
    "c35": 1_800_000,
    "c33": 1_600_000,
  },
};

// ─── Helpers ──────────────────────────────────────────────────
function normalise(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Find base price by fuzzy brand+model match */
function findBasePrice(brand: string, model: string): number | null {
  const b = normalise(brand);
  const m = normalise(model);

  // Try exact brand key
  const brandKeys = Object.keys(BASE_PRICES);
  const brandKey = brandKeys.find((k) => b.includes(k) || k.includes(b));
  if (!brandKey) return null;

  const models = BASE_PRICES[brandKey];
  // Try exact model match first
  if (models[m]) return models[m];

  // Try partial match (model string contains key or vice versa)
  const modelKey = Object.keys(models).find(
    (k) => m.includes(k) || k.includes(m)
  );
  return modelKey ? models[modelKey] : null;
}

/** Condition multiplier (applied to base sell price) */
function conditionMultiplier(condition: string): number {
  const c = normalise(condition);
  if (c.includes("like new") || c.includes("99")) return 0.92;
  if (c.includes("mulus") || c.includes("90")) return 0.82;
  if (c.includes("normal") || c.includes("80")) return 0.72;
  if (c.includes("lecet ringan") || c.includes("70")) return 0.62;
  return 0.50; // banyak lecet / minus
}

/** Storage premium over base (base assumed 128GB) */
function storagePremium(storage?: number): number {
  if (!storage) return 0;
  if (storage >= 1024) return 1_500_000;
  if (storage >= 512) return 800_000;
  if (storage >= 256) return 400_000;
  if (storage >= 128) return 0;
  return -300_000; // 64GB or less
}

/** Battery health deduction */
function batteryDeduction(health?: number): number {
  if (!health) return 0;
  if (health >= 90) return 0;
  if (health >= 80) return -200_000;
  if (health >= 70) return -500_000;
  return -900_000;
}

/** Year depreciation (each year ~8% off) */
function yearDepreciation(year?: number): number {
  if (!year) return 1;
  const age = new Date().getFullYear() - year;
  return Math.max(0.3, 1 - age * 0.08);
}

/** Round to nearest 50k */
function round50k(n: number): number {
  return Math.round(n / 50_000) * 50_000;
}

// ─── Main heuristic ───────────────────────────────────────────
function predict(req: PredictRequest): PredictResponse {
  const base = findBasePrice(req.brand, req.model);

  let confidence: "low" | "medium" | "high" = "low";
  let sellPrice: number;
  let reasoning: string;

  if (base !== null) {
    confidence = "high";
    const condMult = conditionMultiplier(req.condition);
    const yearMult = yearDepreciation(req.year);
    const storageAdj = storagePremium(req.storage);
    const battAdj = batteryDeduction(req.batteryHealth);

    sellPrice = round50k((base * condMult * yearMult) + storageAdj + battAdj);
    reasoning =
      `Berdasarkan harga pasar ${req.brand} ${req.model} di Indonesia (referensi: Rp ${base.toLocaleString("id-ID")}). ` +
      `Kondisi "${req.condition}" memberikan faktor ${(condMult * 100).toFixed(0)}%. ` +
      (req.year ? `Usia perangkat ~${new Date().getFullYear() - req.year} tahun (faktor ${(yearMult * 100).toFixed(0)}%). ` : "") +
      (req.batteryHealth && req.batteryHealth < 90 ? `Baterai ${req.batteryHealth}% mengurangi nilai. ` : "") +
      "Estimasi ini bersifat indikatif — harga aktual bergantung kondisi fisik dan permintaan pasar lokal.";
  } else {
    // Fallback: generic estimate based on brand tier
    confidence = "low";
    const brandTier: Record<string, number> = {
      iphone: 6_000_000, apple: 6_000_000,
      samsung: 4_000_000,
      xiaomi: 2_500_000, redmi: 2_000_000, poco: 2_500_000,
      oppo: 2_500_000, realme: 2_000_000, vivo: 2_500_000,
      asus: 3_000_000, rog: 5_000_000,
      google: 4_000_000, pixel: 4_000_000,
      oneplus: 4_000_000,
      huawei: 3_000_000, honor: 2_500_000,
    };
    const b = normalise(req.brand);
    const tierBase = Object.entries(brandTier).find(([k]) => b.includes(k))?.[1] ?? 2_000_000;
    const condMult = conditionMultiplier(req.condition);
    sellPrice = round50k(tierBase * condMult);
    reasoning =
      `Model "${req.brand} ${req.model}" tidak ditemukan di database referensi kami. ` +
      `Estimasi berdasarkan tier merek dan kondisi "${req.condition}". ` +
      "Akurasi rendah — disarankan cek harga di Tokopedia/OLX untuk referensi lebih akurat.";
  }

  // Buy price = sell price minus margin (15-20%)
  const marginPct = confidence === "high" ? 0.17 : 0.20;
  const buyPrice = round50k(sellPrice * (1 - marginPct));
  const profit = sellPrice - buyPrice;

  // Tips negosiasi
  const tips: string[] = [
    `Tawar harga beli di kisaran Rp ${(buyPrice * 0.95).toLocaleString("id-ID")} – Rp ${buyPrice.toLocaleString("id-ID")} untuk ruang negosiasi.`,
    "Cek kondisi fisik secara menyeluruh: layar, kamera, speaker, mic, dan port charging.",
    "Minta seller nyalakan perangkat dan test semua fungsi utama sebelum deal.",
  ];

  if (req.batteryHealth && req.batteryHealth < 80) {
    tips.push(`Baterai ${req.batteryHealth}% — pertimbangkan biaya ganti baterai (~Rp 200.000–500.000) saat negosiasi.`);
  }
  if (req.condition?.toLowerCase().includes("lecet") || req.condition?.toLowerCase().includes("minus")) {
    tips.push("Kondisi fisik kurang — dokumentasikan kerusakan dengan foto sebelum transaksi.");
  }
  tips.push("Pastikan IMEI terdaftar di Kemenperin (imei.kemenperin.go.id) sebelum membeli.");

  return {
    estimatedBuyPrice: buyPrice,
    estimatedSellPrice: sellPrice,
    estimatedProfit: profit,
    confidence,
    reasoning,
    tips,
  };
}

// ─── Deno HTTP server ─────────────────────────────────────────
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
    const body = await req.json() as PredictRequest;

    if (!body.brand || !body.model) {
      return new Response(
        JSON.stringify({ error: "Field 'brand' dan 'model' wajib diisi" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const result = predict(body);

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
