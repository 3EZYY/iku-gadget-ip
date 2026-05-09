import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// ── Early validation ──────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
  ]
    .filter(Boolean)
    .join(', ');

  console.error(
    `[Supabase] ❌ Environment variable tidak ditemukan: ${missing}\n` +
    `Pastikan file .env sudah diisi dengan benar lalu restart dev server (npm run dev).`
  );
}

// Minimal length check — Supabase anon key adalah JWT (~200+ chars)
if (SUPABASE_PUBLISHABLE_KEY && SUPABASE_PUBLISHABLE_KEY.length < 100) {
  console.error(
    `[Supabase] ❌ VITE_SUPABASE_PUBLISHABLE_KEY terlihat tidak valid (terlalu pendek: ${SUPABASE_PUBLISHABLE_KEY.length} karakter).\n` +
    `Salin ulang anon key dari Supabase Dashboard → Project Settings → API.`
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL ?? '',
  SUPABASE_PUBLISHABLE_KEY ?? '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
