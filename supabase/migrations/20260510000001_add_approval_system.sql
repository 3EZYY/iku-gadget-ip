-- ─── Approval System Migration ───────────────────────────────
-- Adds is_approved column to profiles and updates handle_new_user trigger
-- Self-registered / Google OAuth users start as unapproved
-- Users created by Owner/Admin via createUserWithRole() start as approved

-- 1. Add is_approved column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- 2. Owner and Admin accounts are always approved
UPDATE public.profiles p
SET is_approved = true
FROM public.user_roles ur
WHERE p.id = ur.user_id
  AND ur.role IN ('owner', 'admin');

-- 3. Karyawan created before this migration: approve them too
--    (they were created by Owner/Admin via the UI, not self-registered)
UPDATE public.profiles
SET is_approved = true
WHERE is_approved = false;

-- 4. Replace handle_new_user trigger to set is_approved based on context
--    When role metadata is explicitly set (Owner/Admin creating account),
--    is_approved = true. Self-register / OAuth = false.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role   text;
  _name   text;
  _approved boolean;
BEGIN
  _role  := COALESCE(NEW.raw_user_meta_data->>'role', 'karyawan');
  _name  := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  -- If role is explicitly set to owner/admin, auto-approve
  -- If role is 'karyawan' AND created_by metadata is present → admin created → approve
  -- Otherwise (self-register / OAuth) → pending approval
  IF _role IN ('owner', 'admin') THEN
    _approved := true;
  ELSIF NEW.raw_user_meta_data->>'created_by_admin' = 'true' THEN
    _approved := true;
  ELSE
    _approved := false;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, is_approved)
  VALUES (NEW.id, NEW.email, _name, _approved)
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        full_name  = EXCLUDED.full_name,
        is_approved = EXCLUDED.is_approved;

  -- Only insert role if not already present
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 5. RLS: allow users to read their own approval status
CREATE POLICY "users_read_own_approval"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 6. Allow owner/admin to update is_approved
CREATE POLICY "admin_update_approval"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- 7. New RPC: approve a user and assign their role
CREATE OR REPLACE FUNCTION public.approve_user(
  _target_user_id UUID,
  _role           public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owner/admin can approve
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Set approved
  UPDATE public.profiles
  SET is_approved = true
  WHERE id = _target_user_id;

  -- Upsert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

-- 8. New RPC: get pending users (unapproved)
CREATE OR REPLACE FUNCTION public.get_pending_users()
RETURNS TABLE (
  user_id   UUID,
  email     TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.created_at
  FROM public.profiles p
  WHERE p.is_approved = false
  ORDER BY p.created_at DESC;
END;
$$;
