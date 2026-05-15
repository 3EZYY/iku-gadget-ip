-- ─── Custom Profit Split per Seller ──────────────────────────
-- Allows Owner to set a specific commission % for each karyawan.
-- Journal stores the applied % and nominal amount for historical accuracy.

-- 1. Add komisi_persen to profiles (default 50%)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS komisi_persen INTEGER NOT NULL DEFAULT 50;

-- 2. Add historical split columns to journal
ALTER TABLE public.journal
  ADD COLUMN IF NOT EXISTS komisi_persen_applied INTEGER,
  ADD COLUMN IF NOT EXISTS nominal_komisi NUMERIC;

-- 3. Backfill existing journal rows with 50% default
UPDATE public.journal
SET komisi_persen_applied = 50,
    nominal_komisi = (harga_jual - harga_beli - biaya_operasional) * 0.5
WHERE komisi_persen_applied IS NULL;
