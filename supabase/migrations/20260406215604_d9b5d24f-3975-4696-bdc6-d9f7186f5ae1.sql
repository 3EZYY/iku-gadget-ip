
CREATE TABLE public.incentive_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_units INTEGER NOT NULL DEFAULT 20,
  bonus_percentage NUMERIC NOT NULL DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.incentive_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read the config
CREATE POLICY "Everyone can view incentive config"
  ON public.incentive_config FOR SELECT
  USING (true);

-- Only admin can update
CREATE POLICY "Admin can update incentive config"
  ON public.incentive_config FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default config row
INSERT INTO public.incentive_config (target_units, bonus_percentage) VALUES (20, 5);
