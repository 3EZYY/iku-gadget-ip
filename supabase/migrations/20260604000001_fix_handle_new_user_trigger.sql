-- ─── Fix handle_new_user trigger ─────────────────────────────
-- Hardened version: uses COALESCE to safely handle null/malformed
-- raw_user_meta_data from both email/password and OAuth signups.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role   TEXT;
  _name   TEXT;
  _approved BOOLEAN;
BEGIN
  -- Safely read metadata, defaulting to empty values if null
  _role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'karyawan'
  );

  _name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Validate role — reject unknown values, fallback to karyawan
  IF _role NOT IN ('owner', 'admin', 'karyawan') THEN
    _role := 'karyawan';
  END IF;

  -- Approval logic
  IF _role IN ('owner', 'admin') THEN
    _approved := TRUE;
  ELSIF COALESCE(NEW.raw_user_meta_data->>'created_by_admin', 'false') = 'true' THEN
    _approved := TRUE;
  ELSE
    _approved := FALSE;
  END IF;

  -- Upsert profile (safe on conflict)
  INSERT INTO public.profiles (id, email, full_name, is_approved)
  VALUES (NEW.id, NEW.email, _name, _approved)
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
        is_approved = EXCLUDED.is_approved,
        updated_at  = now();

  -- Upsert role (safe on conflict)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log the error but never let trigger crash signup
  RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists (recreate if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
