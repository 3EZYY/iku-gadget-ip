-- ─── Site Settings (Owner-only) + Rate Limit Table ───────────

-- 1. Site settings — stores Gemini API key etc.
CREATE TABLE IF NOT EXISTS public.site_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemini_api_key TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only owner can read/write
CREATE POLICY "owner_all_site_settings"
  ON public.site_settings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Insert default row
INSERT INTO public.site_settings (gemini_api_key) VALUES (NULL)
ON CONFLICT DO NOTHING;

-- 2. Rate limit tracking table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint   TEXT NOT NULL,
  hit_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access — only service role (Edge Functions) can read/write
-- RLS blocks all authenticated/anon access by default

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits (ip_address, endpoint, hit_at);

-- Auto-cleanup old entries (older than 2 hours)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.rate_limits WHERE hit_at < now() - interval '2 hours';
$$;
