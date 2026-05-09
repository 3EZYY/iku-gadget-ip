-- ============================================================
-- Seed: Confirm emails + assign roles + backfill profiles
-- Jalankan: npx supabase db execute --file supabase/seed.sql
-- ============================================================

-- 1. Confirm semua email (agar bisa login)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Assign roles untuk akun yang dibuat via Dashboard
--    (trigger handle_new_user tidak jalan saat dibuat manual)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'
FROM auth.users
WHERE email = 'owner_arya@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin_bagus@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'karyawan'
FROM auth.users
WHERE email = 'karyawan_dani@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Backfill profiles untuk akun yang sudah ada
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
