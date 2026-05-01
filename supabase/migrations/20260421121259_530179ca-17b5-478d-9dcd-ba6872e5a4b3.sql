-- Fix privilege escalation: restrict self-insert to 'seller' role only
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE POLICY "Users can self-assign seller role only"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'seller');

-- Allow admins to assign any role (so admin can promote others if needed)
CREATE POLICY "Admins can insert any role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow sellers to view their own visit records
CREATE POLICY "Sellers can view their own visits"
  ON public.seller_visits
  FOR SELECT
  USING (auth.uid() = seller_user_id);
