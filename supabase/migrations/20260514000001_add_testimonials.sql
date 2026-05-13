-- ─── Testimonials Table ───────────────────────────────────────
-- Public users submit text-only reviews (pending).
-- Owner/Admin approve and optionally attach a photo.

CREATE TABLE public.testimonials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       TEXT NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  ulasan     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  foto_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (submit review)
CREATE POLICY "public_insert_testimonial"
  ON public.testimonials
  FOR INSERT
  WITH CHECK (true);

-- Public can only SELECT approved testimonials
CREATE POLICY "public_select_approved"
  ON public.testimonials
  FOR SELECT
  USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Owner/Admin full UPDATE access
CREATE POLICY "admin_update_testimonial"
  ON public.testimonials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Owner/Admin full DELETE access
CREATE POLICY "admin_delete_testimonial"
  ON public.testimonials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- NOTE: Create a Supabase Storage bucket named 'testimonials' via Dashboard:
-- Storage → New Bucket → Name: testimonials → Public: true
-- Policy: Allow authenticated users with role owner/admin to upload.
