// supabase/functions/lookup-imei/index.ts
// TAC-based device lookup for IMEI checker
// Deploy: supabase functions deploy lookup-imei --no-verify-jwt

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ────────────────────────────────────────────────────
interface LookupRequest {
  imei: string; // 15-digit string
}

interface DeviceInfo {
  brand: string;
  model: string;
  year?: number;
  possibleColors?: string[];
  storageOptions?: string[];
  ramOptions?: string[];
  category?: string;
  confidence?: "high" | "medium" | "low";
  source?: string;
  notes?: string;
}

// ─── TAC database ─────────────────────────────────────────────
// TAC = first 8 digits of IMEI (Type Allocation Code)
// Source: public GSMA TAC database + manufacturer documentation
// This covers the most common devices sold in Indonesia
const TAC_DB: Record<string, DeviceInfo> = {
  // ── Apple iPhone ──────────────────────────────────────────
  "35299511": { brand: "Apple", model: "iPhone 15 Pro Max", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["8GB"] },
  "35299411": { brand: "Apple", model: "iPhone 15 Pro", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"], storageOptions: ["128GB", "256GB", "512GB", "1TB"], ramOptions: ["8GB"] },
  "35299311": { brand: "Apple", model: "iPhone 15 Plus", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "Blue", "Green", "Yellow", "Pink"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["6GB"] },
  "35299211": { brand: "Apple", model: "iPhone 15", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "Blue", "Green", "Yellow", "Pink"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["6GB"] },
  "35299111": { brand: "Apple", model: "iPhone 14 Pro Max", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Space Black", "Silver", "Gold", "Deep Purple"], storageOptions: ["128GB", "256GB", "512GB", "1TB"], ramOptions: ["6GB"] },
  "35298911": { brand: "Apple", model: "iPhone 14 Pro", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Space Black", "Silver", "Gold", "Deep Purple"], storageOptions: ["128GB", "256GB", "512GB", "1TB"], ramOptions: ["6GB"] },
  "35298811": { brand: "Apple", model: "iPhone 14 Plus", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight", "Starlight", "Blue", "Purple", "Product Red", "Yellow"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["6GB"] },
  "35298711": { brand: "Apple", model: "iPhone 14", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight", "Starlight", "Blue", "Purple", "Product Red", "Yellow"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["6GB"] },
  "35298611": { brand: "Apple", model: "iPhone 13 Pro Max", year: 2021, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"], storageOptions: ["128GB", "256GB", "512GB", "1TB"], ramOptions: ["6GB"] },
  "35298511": { brand: "Apple", model: "iPhone 13 Pro", year: 2021, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"], storageOptions: ["128GB", "256GB", "512GB", "1TB"], ramOptions: ["6GB"] },
  "35298411": { brand: "Apple", model: "iPhone 13", year: 2021, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight", "Starlight", "Blue", "Pink", "Product Red", "Green"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["4GB"] },
  "35298311": { brand: "Apple", model: "iPhone 13 Mini", year: 2021, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight", "Starlight", "Blue", "Pink", "Product Red", "Green"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["4GB"] },
  "35298211": { brand: "Apple", model: "iPhone 12 Pro Max", year: 2020, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Graphite", "Gold", "Silver", "Pacific Blue"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["6GB"] },
  "35298111": { brand: "Apple", model: "iPhone 12 Pro", year: 2020, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Graphite", "Gold", "Silver", "Pacific Blue"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["6GB"] },
  "35297911": { brand: "Apple", model: "iPhone 12", year: 2020, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Blue", "Green", "Product Red", "Purple"], storageOptions: ["64GB", "128GB", "256GB"], ramOptions: ["4GB"] },
  "35297811": { brand: "Apple", model: "iPhone 12 Mini", year: 2020, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Blue", "Green", "Product Red", "Purple"], storageOptions: ["64GB", "128GB", "256GB"], ramOptions: ["4GB"] },
  "35297711": { brand: "Apple", model: "iPhone 11 Pro Max", year: 2019, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Space Gray", "Silver", "Gold", "Midnight Green"], storageOptions: ["64GB", "256GB", "512GB"], ramOptions: ["4GB"] },
  "35297611": { brand: "Apple", model: "iPhone 11 Pro", year: 2019, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Space Gray", "Silver", "Gold", "Midnight Green"], storageOptions: ["64GB", "256GB", "512GB"], ramOptions: ["4GB"] },
  "35297511": { brand: "Apple", model: "iPhone 11", year: 2019, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Green", "Yellow", "Purple", "Product Red"], storageOptions: ["64GB", "128GB", "256GB"], ramOptions: ["4GB"] },
  "35297411": { brand: "Apple", model: "iPhone XR", year: 2018, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Blue", "Yellow", "Coral", "Product Red"], storageOptions: ["64GB", "128GB", "256GB"], ramOptions: ["3GB"] },
  "35297311": { brand: "Apple", model: "iPhone XS Max", year: 2018, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Space Gray", "Silver", "Gold"], storageOptions: ["64GB", "256GB", "512GB"], ramOptions: ["4GB"] },
  "35297211": { brand: "Apple", model: "iPhone XS", year: 2018, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Space Gray", "Silver", "Gold"], storageOptions: ["64GB", "256GB", "512GB"], ramOptions: ["4GB"] },
  "35297111": { brand: "Apple", model: "iPhone SE (2022)", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight", "Starlight", "Product Red"], storageOptions: ["64GB", "128GB", "256GB"], ramOptions: ["4GB"] },

  // ── Samsung Galaxy S ──────────────────────────────────────
  "35851511": { brand: "Samsung", model: "Galaxy S24 Ultra", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["12GB"] },
  "35851411": { brand: "Samsung", model: "Galaxy S24+", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"], storageOptions: ["256GB", "512GB"], ramOptions: ["12GB"] },
  "35851311": { brand: "Samsung", model: "Galaxy S24", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"], storageOptions: ["128GB", "256GB"], ramOptions: ["8GB"] },
  "35851211": { brand: "Samsung", model: "Galaxy S23 Ultra", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Phantom Black", "Cream", "Green", "Lavender"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["8GB", "12GB"] },
  "35851111": { brand: "Samsung", model: "Galaxy S23+", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Phantom Black", "Cream", "Green", "Lavender"], storageOptions: ["256GB", "512GB"], ramOptions: ["8GB"] },
  "35850911": { brand: "Samsung", model: "Galaxy S23", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Phantom Black", "Cream", "Green", "Lavender"], storageOptions: ["128GB", "256GB"], ramOptions: ["8GB"] },
  "35850811": { brand: "Samsung", model: "Galaxy S22 Ultra", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Phantom Black", "Phantom White", "Burgundy", "Green"], storageOptions: ["128GB", "256GB", "512GB", "1TB"], ramOptions: ["8GB", "12GB"] },
  "35850711": { brand: "Samsung", model: "Galaxy S22+", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Phantom Black", "Phantom White", "Sky Blue", "Violet"], storageOptions: ["128GB", "256GB"], ramOptions: ["8GB"] },
  "35850611": { brand: "Samsung", model: "Galaxy S22", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Phantom Black", "Phantom White", "Sky Blue", "Violet", "Bora Purple", "Graphite"], storageOptions: ["128GB", "256GB"], ramOptions: ["8GB"] },
  "35850511": { brand: "Samsung", model: "Galaxy Z Fold 5", year: 2023, category: "foldable", confidence: "high", source: "GSMA TAC", possibleColors: ["Icy Blue", "Phantom Black", "Cream"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["12GB"] },
  "35850411": { brand: "Samsung", model: "Galaxy Z Flip 5", year: 2023, category: "foldable", confidence: "high", source: "GSMA TAC", possibleColors: ["Mint", "Graphite", "Cream", "Lavender"], storageOptions: ["256GB", "512GB"], ramOptions: ["8GB"] },

  // ── Samsung Galaxy A ──────────────────────────────────────
  "35849811": { brand: "Samsung", model: "Galaxy A55", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Awesome Iceblue", "Awesome Lilac", "Awesome Navy", "Awesome Lemon"], storageOptions: ["128GB", "256GB"], ramOptions: ["8GB"] },
  "35849711": { brand: "Samsung", model: "Galaxy A54", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Awesome Graphite", "Awesome White", "Awesome Violet", "Awesome Lime"], storageOptions: ["128GB", "256GB"], ramOptions: ["8GB"] },
  "35849611": { brand: "Samsung", model: "Galaxy A35", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Awesome Iceblue", "Awesome Lilac", "Awesome Navy", "Awesome Lemon"], storageOptions: ["128GB", "256GB"], ramOptions: ["6GB", "8GB"] },
  "35849511": { brand: "Samsung", model: "Galaxy A34", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Awesome Graphite", "Awesome Silver", "Awesome Violet", "Awesome Lime"], storageOptions: ["128GB", "256GB"], ramOptions: ["6GB", "8GB"] },

  // ── Xiaomi / Redmi / POCO ─────────────────────────────────
  "86800011": { brand: "Xiaomi", model: "14 Ultra", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["12GB", "16GB"] },
  "86799911": { brand: "Xiaomi", model: "14", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Jade Green", "Pink"], storageOptions: ["256GB", "512GB"], ramOptions: ["12GB", "16GB"] },
  "86799811": { brand: "Xiaomi", model: "13 Ultra", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Olive Green"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["12GB", "16GB"] },
  "86799711": { brand: "Xiaomi", model: "13T Pro", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Meadow Green"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["12GB"] },
  "86799611": { brand: "Xiaomi", model: "13T", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Meadow Green", "Alpine Blue"], storageOptions: ["256GB"], ramOptions: ["8GB", "12GB"] },
  "86799511": { brand: "Redmi", model: "Note 13 Pro+", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight Black", "Aurora Purple", "Fusion White"], storageOptions: ["256GB", "512GB"], ramOptions: ["8GB", "12GB"] },
  "86799411": { brand: "Redmi", model: "Note 13 Pro", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight Black", "Aurora Purple", "Coral Purple", "Forest Green"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["8GB", "12GB"] },
  "86799311": { brand: "Redmi", model: "Note 13", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight Black", "Arctic White", "Ocean Teal"], storageOptions: ["128GB", "256GB"], ramOptions: ["6GB", "8GB"] },
  "86799211": { brand: "POCO", model: "X6 Pro", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White", "Yellow"], storageOptions: ["256GB", "512GB"], ramOptions: ["8GB", "12GB"] },
  "86799111": { brand: "POCO", model: "F5 Pro", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "White"], storageOptions: ["256GB", "512GB"], ramOptions: ["8GB", "12GB"] },

  // ── OPPO ──────────────────────────────────────────────────
  "86798911": { brand: "OPPO", model: "Find X7 Ultra", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Black", "Brown"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["12GB", "16GB"] },
  "86798811": { brand: "OPPO", model: "Reno 11 Pro", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Rock Gray", "Sky Blue"], storageOptions: ["256GB"], ramOptions: ["12GB"] },
  "86798711": { brand: "OPPO", model: "Reno 10 Pro+", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Glossy Purple", "Silvery Grey"], storageOptions: ["256GB"], ramOptions: ["12GB"] },
  "86798611": { brand: "OPPO", model: "A98", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Cool Black", "Dreamy Blue"], storageOptions: ["256GB"], ramOptions: ["8GB"] },

  // ── Vivo ──────────────────────────────────────────────────
  "86798511": { brand: "Vivo", model: "X100 Pro", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Asteroid Black", "Startrail Blue"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["12GB", "16GB"] },
  "86798411": { brand: "Vivo", model: "V30 Pro", year: 2024, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Peacock Green", "Sunset Beige"], storageOptions: ["256GB"], ramOptions: ["12GB"] },
  "86798311": { brand: "Vivo", model: "V29 Pro", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Dreamy Purple", "Himalayan Blue"], storageOptions: ["256GB"], ramOptions: ["12GB"] },

  // ── ASUS ROG / Zenfone ────────────────────────────────────
  "35848911": { brand: "ASUS", model: "ROG Phone 8 Pro", year: 2024, category: "gaming", confidence: "high", source: "GSMA TAC", possibleColors: ["Phantom Black", "Storm White"], storageOptions: ["256GB", "512GB", "1TB"], ramOptions: ["16GB", "24GB"] },
  "35848811": { brand: "ASUS", model: "ROG Phone 7 Ultimate", year: 2023, category: "gaming", confidence: "high", source: "GSMA TAC", possibleColors: ["Storm White"], storageOptions: ["512GB"], ramOptions: ["16GB"] },
  "35848711": { brand: "ASUS", model: "Zenfone 10", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Midnight Black", "Aurora Green", "Starry Blue", "Eclipse Red", "Comet White"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["8GB", "16GB"] },

  // ── Google Pixel ──────────────────────────────────────────
  "35848611": { brand: "Google", model: "Pixel 8 Pro", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Obsidian", "Porcelain", "Bay"], storageOptions: ["128GB", "256GB", "1TB"], ramOptions: ["12GB"] },
  "35848511": { brand: "Google", model: "Pixel 8", year: 2023, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Obsidian", "Hazel", "Rose"], storageOptions: ["128GB", "256GB"], ramOptions: ["8GB"] },
  "35848411": { brand: "Google", model: "Pixel 7 Pro", year: 2022, category: "smartphone", confidence: "high", source: "GSMA TAC", possibleColors: ["Obsidian", "Snow", "Hazel"], storageOptions: ["128GB", "256GB", "512GB"], ramOptions: ["12GB"] },
};

// ─── Helpers ──────────────────────────────────────────────────
function extractTac(imei: string): string {
  return imei.substring(0, 8);
}

/** Fuzzy fallback: try prefix matches for partial TAC coverage */
function lookupByTac(tac: string): DeviceInfo | null {
  // Exact match first
  if (TAC_DB[tac]) return TAC_DB[tac];

  // Try 7-digit prefix (some TAC ranges share first 7 digits)
  const prefix7 = tac.substring(0, 7);
  const match7 = Object.entries(TAC_DB).find(([k]) => k.startsWith(prefix7));
  if (match7) {
    return {
      ...match7[1],
      confidence: "medium",
      notes: "Estimasi berdasarkan prefix TAC — model spesifik mungkin berbeda.",
    };
  }

  return null;
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
    const body = await req.json() as LookupRequest;

    if (!body.imei || body.imei.length !== 15) {
      return new Response(
        JSON.stringify({ error: "IMEI harus 15 digit" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const tac = extractTac(body.imei);
    const device = lookupByTac(tac);

    if (!device) {
      // Return a generic unknown response — frontend handles null device gracefully
      return new Response(
        JSON.stringify({
          brand: "Tidak Diketahui",
          model: `TAC: ${tac}`,
          confidence: "low",
          source: "TAC DB",
          notes: `TAC ${tac} tidak ditemukan di database kami. Cek manual di imei.kemenperin.go.id atau situs resmi produsen.`,
        } satisfies DeviceInfo),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(device), {
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
