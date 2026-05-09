-- ============================================================
-- Migration: Expand roles to owner / admin / karyawan
-- Replaces old 'seller' role with 'karyawan', adds 'owner'
-- ============================================================

-- 1. Drop all existing RLS policies that reference app_role
DROP POLICY IF EXISTS "Admins can create journal"        ON public.journal;
DROP POLICY IF EXISTS "Admins can update journal"        ON public.journal;
DROP POLICY IF EXISTS "Admins can delete journal"        ON public.journal;
DROP POLICY IF EXISTS "Users can view their own journal" ON public.journal;

DROP POLICY IF EXISTS "Admin can view seller visits"     ON public.seller_visits;
DROP POLICY IF EXISTS "Admin can update seller visits"   ON public.seller_visits;
DROP POLICY IF EXISTS "Users can log their own visit"    ON public.seller_visits;
DROP POLICY IF EXISTS "Sellers can view their own visits" ON public.seller_visits;

DROP POLICY IF EXISTS "Everyone can view incentive config" ON public.incentive_config;
DROP POLICY IF EXISTS "Admin can update incentive config"  ON public.incentive_config;

DROP POLICY IF EXISTS "Users can view their own roles"      ON public.user_roles;
DROP POLICY IF EXISTS "Users can self-assign seller role only" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert any role"          ON public.user_roles;

-- 2. Drop the trigger that enforces single-admin (will recreate)
DROP TRIGGER IF EXISTS enforce_single_admin ON public.user_roles;
DROP FUNCTION IF EXISTS public.check_admin_limit();

-- 3. Drop the has_role function (depends on enum, will recreate)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 4. Rename existing enum values: seller -> karyawan, add owner
--    PostgreSQL doesn't support DROP VALUE, so we recreate the type.
--    Steps: rename old type, create new type, alter columns, drop old type.

ALTER TYPE public.app_role RENAME TO app_role_old;

CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'karyawan');

-- Migrate existing data: 'seller' -> 'karyawan', 'admin' stays
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role
  USING (
    CASE role::text
      WHEN 'admin'  THEN 'admin'::public.app_role
      WHEN 'seller' THEN 'karyawan'::public.app_role
      ELSE 'karyawan'::public.app_role
    END
  );

DROP TYPE public.app_role_old;

-- 5. Recreate has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Recreate single-admin limit trigger
CREATE OR REPLACE FUNCTION public.check_admin_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE role = 'admin' AND user_id != NEW.user_id
    ) THEN
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

-- ============================================================
-- 7. RLS Policies — user_roles
-- ============================================================

-- Users can read their own role
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- New users self-assign karyawan only
CREATE POLICY "Users can self-assign karyawan role only"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'karyawan');

-- Admin can assign any role
CREATE POLICY "Admins can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 8. RLS Policies — journal
-- ============================================================

-- owner: read-only, sees ALL journal entries (monitoring)
CREATE POLICY "Owner can view all journal"
  ON public.journal FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

-- admin: full CRUD on all entries
CREATE POLICY "Admin can view all journal"
  ON public.journal FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can create journal"
  ON public.journal FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update journal"
  ON public.journal FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete journal"
  ON public.journal FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- karyawan: INSERT own entries + SELECT own entries only
CREATE POLICY "Karyawan can view own journal"
  ON public.journal FOR SELECT
  USING (
    public.has_role(auth.uid(), 'karyawan')
    AND auth.uid() = user_id
  );

CREATE POLICY "Karyawan can create own journal"
  ON public.journal FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'karyawan')
    AND auth.uid() = user_id
  );

-- ============================================================
-- 9. RLS Policies — seller_visits
-- ============================================================

-- owner: read-only monitoring of all visits
CREATE POLICY "Owner can view all seller visits"
  ON public.seller_visits FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

-- admin: view and mark-as-seen
CREATE POLICY "Admin can view seller visits"
  ON public.seller_visits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update seller visits"
  ON public.seller_visits FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- karyawan: log own visit + view own visits
CREATE POLICY "Karyawan can log their own visit"
  ON public.seller_visits FOR INSERT
  WITH CHECK (auth.uid() = seller_user_id);

CREATE POLICY "Karyawan can view their own visits"
  ON public.seller_visits FOR SELECT
  USING (auth.uid() = seller_user_id);

-- ============================================================
-- 10. RLS Policies — incentive_config
-- ============================================================

-- Everyone (all roles) can read incentive config
CREATE POLICY "Everyone can view incentive config"
  ON public.incentive_config FOR SELECT
  USING (true);

-- Only admin can update
CREATE POLICY "Admin can update incentive config"
  ON public.incentive_config FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
