
-- 1. Trigger to limit admin to only 1 person
CREATE OR REPLACE FUNCTION public.check_admin_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin' AND user_id != NEW.user_id) THEN
      RAISE EXCEPTION 'Hanya boleh ada 1 admin di toko ini';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_single_admin
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_limit();

-- 2. Notifications table for seller visits
CREATE TABLE public.seller_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id UUID NOT NULL,
  seller_email TEXT NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  seen BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.seller_visits ENABLE ROW LEVEL SECURITY;

-- Only admin can view notifications
CREATE POLICY "Admin can view seller visits"
  ON public.seller_visits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admin can update (mark as seen)
CREATE POLICY "Admin can update seller visits"
  ON public.seller_visits FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert their own visit
CREATE POLICY "Users can log their own visit"
  ON public.seller_visits FOR INSERT
  WITH CHECK (auth.uid() = seller_user_id);

-- Enable realtime for seller_visits
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_visits;
