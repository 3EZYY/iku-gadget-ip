-- ─── Storage RLS Policies for 'testimonials' bucket ──────────
-- Fixes: "new row violates row-level security policy" on upload

-- 1. Public can READ (view) images in the testimonials bucket
CREATE POLICY "public_read_testimonials_bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'testimonials');

-- 2. Authenticated users can UPLOAD images to the testimonials bucket
CREATE POLICY "authenticated_insert_testimonials_bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'testimonials');

-- 3. Authenticated users can UPDATE images in the testimonials bucket
CREATE POLICY "authenticated_update_testimonials_bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'testimonials');

-- 4. Authenticated users can DELETE images in the testimonials bucket
CREATE POLICY "authenticated_delete_testimonials_bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonials');
