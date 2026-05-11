-- ─── Dummy Data Seed ─────────────────────────────────────────
-- Run after migrations are applied and production accounts exist.
-- Safe to re-run: uses ON CONFLICT DO NOTHING throughout.
--
-- Prerequisites:
--   karyawan_dani@gmail.com  must exist in auth.users
--   karyawan_budi@gmail.com  must exist in auth.users (create via UserManagement UI first)
--
-- Usage:
--   npx supabase db query --file supabase/seed_dummy.sql --linked

-- ─── 1. Products ──────────────────────────────────────────────
INSERT INTO public.products
  (id, nama, merk, model, kondisi, penyimpanan, ram, harga_jual, harga_beli, stok, foto_url)
VALUES
  -- Apple iPhones
  ('11111111-0001-0001-0001-000000000001', 'iPhone 15 Pro Max 256GB Natural Titanium', 'Apple', 'iPhone 15 Pro Max', 'Baik',       '256GB', '8GB',  18500000, 16000000, 1, NULL),
  ('11111111-0001-0001-0001-000000000002', 'iPhone 15 Pro 128GB Black Titanium',       'Apple', 'iPhone 15 Pro',     'Baik',       '128GB', '8GB',  15500000, 13500000, 2, NULL),
  ('11111111-0001-0001-0001-000000000003', 'iPhone 14 Pro Max 256GB Deep Purple',      'Apple', 'iPhone 14 Pro Max', 'Baik',       '256GB', '6GB',  14000000, 12000000, 1, NULL),
  ('11111111-0001-0001-0001-000000000004', 'iPhone 14 128GB Midnight',                 'Apple', 'iPhone 14',         'Baik',       '128GB', '6GB',   9000000,  7500000, 3, NULL),
  ('11111111-0001-0001-0001-000000000005', 'iPhone 13 Pro 256GB Sierra Blue',          'Apple', 'iPhone 13 Pro',     'Cukup',      '256GB', '6GB',   9500000,  8000000, 1, NULL),
  ('11111111-0001-0001-0001-000000000006', 'iPhone 13 128GB Pink',                     'Apple', 'iPhone 13',         'Baik',       '128GB', '4GB',   7500000,  6200000, 2, NULL),
  ('11111111-0001-0001-0001-000000000007', 'iPhone 12 64GB Black',                     'Apple', 'iPhone 12',         'Cukup',      '64GB',  '4GB',   5500000,  4500000, 1, NULL),
  ('11111111-0001-0001-0001-000000000008', 'iPhone 11 128GB White',                    'Apple', 'iPhone 11',         'Cukup',      '128GB', '4GB',   4800000,  3900000, 2, NULL),
  ('11111111-0001-0001-0001-000000000009', 'iPhone XR 64GB Coral',                     'Apple', 'iPhone XR',         'Rusak Ringan','64GB', '3GB',   3200000,  2500000, 1, NULL),
  ('11111111-0001-0001-0001-000000000010', 'iPhone SE 2022 64GB Starlight',            'Apple', 'iPhone SE (2022)',  'Baik',       '64GB',  '4GB',   3800000,  3100000, 2, NULL),

  -- Samsung
  ('11111111-0001-0001-0001-000000000011', 'Samsung Galaxy S24 Ultra 256GB Titanium Black', 'Samsung', 'Galaxy S24 Ultra', 'Baik',  '256GB', '12GB', 17000000, 14500000, 1, NULL),
  ('11111111-0001-0001-0001-000000000012', 'Samsung Galaxy S23 Ultra 256GB Phantom Black',  'Samsung', 'Galaxy S23 Ultra', 'Baik',  '256GB', '12GB', 13000000, 11000000, 2, NULL),
  ('11111111-0001-0001-0001-000000000013', 'Samsung Galaxy S23 128GB Lavender',             'Samsung', 'Galaxy S23',       'Baik',  '128GB', '8GB',   8000000,  6500000, 3, NULL),
  ('11111111-0001-0001-0001-000000000014', 'Samsung Galaxy A55 256GB Awesome Iceblue',      'Samsung', 'Galaxy A55',       'Baik',  '256GB', '8GB',   5000000,  4000000, 4, NULL),
  ('11111111-0001-0001-0001-000000000015', 'Samsung Galaxy A54 128GB Awesome Graphite',     'Samsung', 'Galaxy A54',       'Cukup', '128GB', '8GB',   4000000,  3200000, 2, NULL),
  ('11111111-0001-0001-0001-000000000016', 'Samsung Galaxy Z Flip 5 256GB Mint',            'Samsung', 'Galaxy Z Flip 5',  'Baik',  '256GB', '8GB',   9500000,  8000000, 1, NULL),
  ('11111111-0001-0001-0001-000000000017', 'Samsung Galaxy Note 20 Ultra 256GB Mystic Black','Samsung','Galaxy Note 20 Ultra','Cukup','256GB','12GB',  8500000,  7000000, 1, NULL),

  -- Xiaomi / Redmi
  ('11111111-0001-0001-0001-000000000018', 'Xiaomi 14 Ultra 512GB Black',              'Xiaomi', 'Xiaomi 14 Ultra',    'Baik',  '512GB', '16GB', 13000000, 11000000, 1, NULL),
  ('11111111-0001-0001-0001-000000000019', 'Xiaomi 13T Pro 256GB Alpine Blue',         'Xiaomi', 'Xiaomi 13T Pro',     'Baik',  '256GB', '12GB',  6500000,  5200000, 2, NULL),
  ('11111111-0001-0001-0001-000000000020', 'Redmi Note 13 Pro+ 256GB Aurora Purple',   'Redmi',  'Redmi Note 13 Pro+', 'Baik',  '256GB', '12GB',  5000000,  4000000, 3, NULL),
  ('11111111-0001-0001-0001-000000000021', 'Redmi Note 12 Pro 128GB Midnight Black',   'Redmi',  'Redmi Note 12 Pro',  'Cukup', '128GB', '8GB',   3200000,  2500000, 2, NULL),
  ('11111111-0001-0001-0001-000000000022', 'POCO X6 Pro 256GB Yellow',                 'Xiaomi', 'POCO X6 Pro',        'Baik',  '256GB', '12GB',  4800000,  3800000, 2, NULL),

  -- OPPO / Vivo / Realme
  ('11111111-0001-0001-0001-000000000023', 'OPPO Find X7 Ultra 256GB Black',           'OPPO',   'Find X7 Ultra',      'Baik',  '256GB', '16GB', 12500000, 10500000, 1, NULL),
  ('11111111-0001-0001-0001-000000000024', 'OPPO Reno 11 Pro 256GB Rock Gray',         'OPPO',   'Reno 11 Pro',        'Baik',  '256GB', '12GB',  6000000,  4800000, 2, NULL),
  ('11111111-0001-0001-0001-000000000025', 'Vivo X100 Pro 256GB Asteroid Black',       'Vivo',   'X100 Pro',           'Baik',  '256GB', '16GB', 11500000,  9500000, 1, NULL),
  ('11111111-0001-0001-0001-000000000026', 'Realme GT 5 Pro 256GB Black',              'Realme', 'Realme GT 5 Pro',    'Baik',  '256GB', '12GB',  7500000,  6000000, 2, NULL)

ON CONFLICT (id) DO NOTHING;


-- ─── 2. Journal Transactions ──────────────────────────────────
-- Requires karyawan_dani and karyawan_budi user IDs.
-- Replace the UUIDs below with actual user IDs from your Supabase auth.users table.
-- You can find them via: SELECT id, email FROM auth.users;
--
-- Placeholder UUIDs — REPLACE BEFORE RUNNING:
--   dani_id  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
--   budi_id  = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

DO $$
DECLARE
  dani_id  UUID;
  budi_id  UUID;
BEGIN
  -- Lookup actual user IDs by email
  SELECT id INTO dani_id FROM auth.users WHERE email = 'karyawan_dani@gmail.com' LIMIT 1;
  SELECT id INTO budi_id FROM auth.users WHERE email = 'karyawan_budi@gmail.com' LIMIT 1;

  IF dani_id IS NULL THEN
    RAISE NOTICE 'karyawan_dani@gmail.com not found — skipping journal seed';
    RETURN;
  END IF;

  -- ── Dani's transactions (last 3 months) ──────────────────
  INSERT INTO public.journal
    (id, user_id, tanggal, nama_seller, jenis_unit, nama_unit, harga_jual, harga_beli, biaya_operasional, keterangan_biaya)
  VALUES
    -- March 2026
    ('22222222-0001-0001-0001-000000000001', dani_id, '2026-03-05', 'Dani', 'HP', 'iPhone 13 128GB',        7500000, 6200000, 50000,  'Ongkir'),
    ('22222222-0001-0001-0001-000000000002', dani_id, '2026-03-08', 'Dani', 'HP', 'Samsung Galaxy A54',     4000000, 3200000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000003', dani_id, '2026-03-12', 'Dani', 'HP', 'Redmi Note 12 Pro',      3200000, 2500000, 30000,  'Ongkir'),
    ('22222222-0001-0001-0001-000000000004', dani_id, '2026-03-15', 'Dani', 'HP', 'iPhone 11 128GB',        4800000, 3900000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000005', dani_id, '2026-03-19', 'Dani', 'HP', 'OPPO Reno 10 Pro',       4500000, 3600000, 50000,  'Servis minor'),
    ('22222222-0001-0001-0001-000000000006', dani_id, '2026-03-22', 'Dani', 'HP', 'Xiaomi 13T 256GB',       5500000, 4400000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000007', dani_id, '2026-03-25', 'Dani', 'HP', 'Samsung Galaxy S22',     6500000, 5300000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000008', dani_id, '2026-03-28', 'Dani', 'HP', 'iPhone XR 64GB',         3200000, 2500000, 0,      NULL),

    -- April 2026
    ('22222222-0001-0001-0001-000000000009', dani_id, '2026-04-02', 'Dani', 'HP', 'iPhone 14 128GB',        9000000, 7500000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000010', dani_id, '2026-04-05', 'Dani', 'HP', 'Samsung Galaxy A55',     5000000, 4000000, 50000,  'Ongkir'),
    ('22222222-0001-0001-0001-000000000011', dani_id, '2026-04-08', 'Dani', 'HP', 'Redmi Note 13 Pro+',     5000000, 4000000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000012', dani_id, '2026-04-11', 'Dani', 'HP', 'POCO X6 Pro 256GB',      4800000, 3800000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000013', dani_id, '2026-04-14', 'Dani', 'HP', 'Vivo V30 Pro',           5500000, 4400000, 30000,  'Ongkir'),
    ('22222222-0001-0001-0001-000000000014', dani_id, '2026-04-17', 'Dani', 'HP', 'iPhone 12 64GB',         5500000, 4500000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000015', dani_id, '2026-04-21', 'Dani', 'HP', 'Samsung Galaxy Note 20', 7000000, 5800000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000016', dani_id, '2026-04-24', 'Dani', 'HP', 'Realme GT 5 Pro',        7500000, 6000000, 50000,  'Servis'),
    ('22222222-0001-0001-0001-000000000017', dani_id, '2026-04-28', 'Dani', 'HP', 'iPhone SE 2022',         3800000, 3100000, 0,      NULL),

    -- May 2026
    ('22222222-0001-0001-0001-000000000018', dani_id, '2026-05-02', 'Dani', 'HP', 'iPhone 15 Pro 128GB',   15500000,13500000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000019', dani_id, '2026-05-05', 'Dani', 'HP', 'Samsung Galaxy S24 Ultra',17000000,14500000,100000,'Ongkir + admin'),
    ('22222222-0001-0001-0001-000000000020', dani_id, '2026-05-07', 'Dani', 'HP', 'Xiaomi 14 Ultra 512GB', 13000000,11000000, 0,      NULL),
    ('22222222-0001-0001-0001-000000000021', dani_id, '2026-05-09', 'Dani', 'HP', 'iPhone 14 Pro Max 256GB',14000000,12000000, 0,      NULL)

  ON CONFLICT (id) DO NOTHING;

  -- ── Budi's transactions (if account exists) ───────────────
  IF budi_id IS NOT NULL THEN
    INSERT INTO public.journal
      (id, user_id, tanggal, nama_seller, jenis_unit, nama_unit, harga_jual, harga_beli, biaya_operasional, keterangan_biaya)
    VALUES
      -- March 2026
      ('33333333-0001-0001-0001-000000000001', budi_id, '2026-03-06', 'Budi', 'HP', 'Samsung Galaxy S23',     8000000, 6500000, 0,     NULL),
      ('33333333-0001-0001-0001-000000000002', budi_id, '2026-03-10', 'Budi', 'HP', 'iPhone 13 Pro 256GB',    9500000, 8000000, 50000, 'Ongkir'),
      ('33333333-0001-0001-0001-000000000003', budi_id, '2026-03-14', 'Budi', 'HP', 'OPPO Find X7 Ultra',    12500000,10500000, 0,     NULL),
      ('33333333-0001-0001-0001-000000000004', budi_id, '2026-03-18', 'Budi', 'HP', 'Redmi Note 13 128GB',    2800000, 2200000, 0,     NULL),
      ('33333333-0001-0001-0001-000000000005', budi_id, '2026-03-23', 'Budi', 'HP', 'Vivo X100 Pro',         11500000, 9500000, 50000, 'Servis'),
      ('33333333-0001-0001-0001-000000000006', budi_id, '2026-03-27', 'Budi', 'HP', 'Samsung Galaxy Z Flip 5',9500000, 8000000, 0,     NULL),

      -- April 2026
      ('33333333-0001-0001-0001-000000000007', budi_id, '2026-04-03', 'Budi', 'HP', 'iPhone 14 Plus 256GB',  10000000, 8200000, 0,     NULL),
      ('33333333-0001-0001-0001-000000000008', budi_id, '2026-04-07', 'Budi', 'HP', 'Xiaomi 13T Pro 256GB',   6500000, 5200000, 30000, 'Ongkir'),
      ('33333333-0001-0001-0001-000000000009', budi_id, '2026-04-12', 'Budi', 'HP', 'Samsung Galaxy A54',     4000000, 3200000, 0,     NULL),
      ('33333333-0001-0001-0001-000000000010', budi_id, '2026-04-16', 'Budi', 'HP', 'OPPO Reno 11 Pro',       6000000, 4800000, 0,     NULL),
      ('33333333-0001-0001-0001-000000000011', budi_id, '2026-04-20', 'Budi', 'HP', 'iPhone 12 128GB',        6000000, 4900000, 0,     NULL),
      ('33333333-0001-0001-0001-000000000012', budi_id, '2026-04-25', 'Budi', 'HP', 'Realme GT Neo 5',        5000000, 4000000, 50000, 'Servis minor'),

      -- May 2026
      ('33333333-0001-0001-0001-000000000013', budi_id, '2026-05-03', 'Budi', 'HP', 'Samsung Galaxy S23 Ultra',13000000,11000000,0,    NULL),
      ('33333333-0001-0001-0001-000000000014', budi_id, '2026-05-06', 'Budi', 'HP', 'iPhone 15 Pro Max 256GB',18500000,16000000,100000,'Ongkir + admin'),
      ('33333333-0001-0001-0001-000000000015', budi_id, '2026-05-08', 'Budi', 'HP', 'Vivo V30 Pro 256GB',     5500000, 4400000, 0,     NULL)

    ON CONFLICT (id) DO NOTHING;
  ELSE
    RAISE NOTICE 'karyawan_budi@gmail.com not found — skipping Budi transactions';
  END IF;

END $$;
