-- ─── RPC: update_user_role ────────────────────────────────────
-- Allows the Owner to change a user's role (admin <-> karyawan).
-- SECURITY DEFINER to bypass RLS safely — caller must be owner.
-- Guards:
--   1. Caller must hold the 'owner' role.
--   2. Owner cannot change their own role (lockout prevention).
--   3. Only 'admin' and 'karyawan' are valid target roles.

CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role        TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verify the caller is an owner
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Hanya owner yang dapat mengubah role pengguna';
  END IF;

  -- 2. Prevent the owner from demoting themselves
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Owner tidak dapat mengubah role diri sendiri';
  END IF;

  -- 3. Only allow promotion/demotion between admin and karyawan
  IF new_role NOT IN ('admin', 'karyawan') THEN
    RAISE EXCEPTION 'Role tidak valid. Pilihan yang tersedia: admin atau karyawan';
  END IF;

  -- 4. Perform the update
  UPDATE public.user_roles
  SET role = new_role::public.app_role
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan dalam sistem';
  END IF;
END;
$$;
