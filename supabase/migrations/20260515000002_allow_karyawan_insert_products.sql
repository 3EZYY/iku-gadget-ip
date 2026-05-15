-- ─── Allow Karyawan to INSERT products (Catat Barang Masuk) ──
-- Also add RPC for safe stock deduction on sale

-- 1. Allow karyawan to insert products
CREATE POLICY "karyawan_insert_products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'karyawan')
    )
  );

-- 2. RPC: safely deduct stock by 1 (prevents race conditions)
CREATE OR REPLACE FUNCTION public.deduct_product_stock(_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stok = stok - 1,
      updated_at = now()
  WHERE id = _product_id
    AND stok > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stok produk habis atau produk tidak ditemukan';
  END IF;
END;
$$;
