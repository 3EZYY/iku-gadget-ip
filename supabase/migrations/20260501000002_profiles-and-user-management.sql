-- ============================================================
-- Migration: Profiles table + User Management system
-- Supports 3-tier role: owner / admin / karyawan
-- ============================================================

-- ── 1. Profiles table ─────────────────────────────────────────
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger: keep updated_at fresh
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 2. RLS — profiles ─────────────────────────────────────────

-- Owner: full access
CREATE POLICY "Owner has full access to profiles"
  ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Admin: read all profiles, update any profile
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Any user: read and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- System insert (via trigger) — allow service role
CREATE POLICY "Allow profile insert on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── 3. handle_new_user trigger ────────────────────────────────
-- Fires on every new auth.users row.
-- Reads raw_user_meta_data->>'role' to assign the correct role.
-- Falls back to 'karyawan' if no role is specified.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role  public.app_role;
  _name  TEXT;
BEGIN
  -- Resolve role from metadata, default to karyawan
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'karyawan'
  );

  -- Resolve display name from metadata
  _name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );

  -- Insert profile row
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, _name)
  ON CONFLICT (id) DO NOTHING;

  -- Insert role row (skip if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 4. RLS — user_roles (add admin management policies) ───────

-- Admin can view all roles (needed for user management UI)
CREATE POLICY "Admin can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert karyawan roles (cannot create owner/admin)
CREATE POLICY "Admin can insert karyawan role"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND role = 'karyawan'
  );

-- Admin can delete karyawan roles only
CREATE POLICY "Admin can delete karyawan role"
  ON public.user_roles FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    AND role = 'karyawan'
  );

-- Owner can update any role (promote/demote)
CREATE POLICY "Owner can update any role"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Owner can delete any role
CREATE POLICY "Owner can delete any role"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'owner'));

-- ── 5. Helper: get_user_list() ────────────────────────────────
-- Returns joined profiles + roles for the management UI.
-- SECURITY DEFINER so it bypasses RLS on auth.users.
-- Only callable by owner or admin (checked inside function).

CREATE OR REPLACE FUNCTION public.get_user_list()
RETURNS TABLE (
  user_id    UUID,
  email      TEXT,
  full_name  TEXT,
  role       public.app_role,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce: only owner or admin may call this
  IF NOT (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
    SELECT
      p.id          AS user_id,
      p.email,
      p.full_name,
      ur.role,
      p.created_at
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- ── 6. Helper: create_user_with_role() ───────────────────────
-- Called by owner/admin to create a new account with a specific role.
-- Uses Supabase admin API via pg_net is NOT available here, so this
-- function handles the role assignment after the auth user is created
-- client-side. The actual auth.users insert is done via the JS client
-- using supabase.auth.admin.createUser() from a server action or
-- Supabase Edge Function. This function just validates + assigns role.

CREATE OR REPLACE FUNCTION public.assign_role_to_user(
  _target_user_id UUID,
  _role           public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owner can assign 'admin' or 'owner' roles
  IF _role IN ('admin', 'owner') THEN
    IF NOT public.has_role(auth.uid(), 'owner') THEN
      RAISE EXCEPTION 'Hanya owner yang dapat menetapkan role admin atau owner';
    END IF;
  END IF;

  -- Owner or admin can assign 'karyawan'
  IF _role = 'karyawan' THEN
    IF NOT (
      public.has_role(auth.uid(), 'owner') OR
      public.has_role(auth.uid(), 'admin')
    ) THEN
      RAISE EXCEPTION 'Akses ditolak';
    END IF;
  END IF;

  -- Upsert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- ── 7. Helper: remove_user_role() ────────────────────────────
CREATE OR REPLACE FUNCTION public.remove_user_role(
  _target_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_role public.app_role;
BEGIN
  SELECT role INTO _target_role
  FROM public.user_roles
  WHERE user_id = _target_user_id;

  -- Owner can remove anyone
  IF public.has_role(auth.uid(), 'owner') THEN
    DELETE FROM public.user_roles WHERE user_id = _target_user_id;
    RETURN;
  END IF;

  -- Admin can only remove karyawan
  IF public.has_role(auth.uid(), 'admin') THEN
    IF _target_role != 'karyawan' THEN
      RAISE EXCEPTION 'Admin hanya dapat menghapus akun karyawan';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = _target_user_id;
    RETURN;
  END IF;

  RAISE EXCEPTION 'Akses ditolak';
END;
$$;
