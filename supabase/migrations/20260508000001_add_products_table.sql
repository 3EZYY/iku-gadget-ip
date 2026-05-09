-- Migration 10: Add products table with RLS
-- Timestamp: 20260508000001
-- Description: Tabel produk untuk katalog toko — menggantikan localStorage di Tab Toko karyawan

-- ─── 1. Create table ──────────────────────────────────────────
CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            TEXT NOT NULL,
  merk            TEXT NOT NULL,
  model           TEXT NOT NULL,
  kondisi         TEXT NOT NULL CHECK (kondisi IN ('Baik', 'Cukup', 'Rusak Ringan')),
  penyimpanan     TEXT,
  ram             TEXT,
  harga_jual      NUMERIC NOT NULL,
  harga_beli      NUMERIC NOT NULL,
  stok            INTEGER NOT NULL DEFAULT 0,
  foto_url        TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Auto-update updated_at trigger ───────────────────────
CREATE OR REPLACE FUNCTION public.handle_products_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_products_updated_at();

-- ─── 3. Enable Row Level Security ────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ─── 4. RLS Policies ─────────────────────────────────────────

-- Owner: full access (ALL rows, no filter)
CREATE POLICY "owner_products_all"
  ON public.products
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'owner'))
  WITH CHECK (has_role(auth.uid(), 'owner'));

-- Admin: full access (ALL rows, no filter)
CREATE POLICY "admin_products_all"
  ON public.products
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Karyawan: SELECT only (read all products, cannot modify)
CREATE POLICY "karyawan_products_select"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'karyawan'));

-- ─── 5. Add to realtime publication (optional, for live catalog) ──
-- Uncomment if you want karyawan to see product updates in real-time
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
