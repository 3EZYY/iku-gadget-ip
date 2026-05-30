# Ringkasan Teknis: Iku Gadget & Stuff
**Project B** — `C:\laragon\www\iku-gadget-ip`
**Supabase Project Ref:** `erszdnnbkvraygofkdcr`

---

## 🤖 AI Context Brief
> Baca section ini terlebih dahulu sebelum membantu developer dengan project ini.

### Identitas Project
Ini adalah aplikasi manajemen penjualan gadget bekas bernama **"Iku Gadget & Stuff"** milik toko fisik. Dibangun dengan **Vite + React 18 + TypeScript + Supabase**. Bukan Next.js — murni Vite SPA.

### Tiga Role Pengguna
| Role | Akses | Halaman |
|---|---|---|
| `owner` | Kontrol absolut, lihat semua data, kelola semua user | `/owner` |
| `admin` | Operasional harian, CRUD jurnal, kelola karyawan | `/admin` |
| `karyawan` | Input transaksi sendiri, lihat data sendiri saja | `/karyawan` |

Owner dan admin **share satu komponen** (`ManagementDashboard.tsx`) — UI dikondisikan via `useRole()`. Karyawan punya halaman sendiri (`KaryawanDashboard.tsx`) dengan 5 tab.

### Konvensi Kode yang Dipakai
- **Supabase client** selalu diimport dari `@/integrations/supabase/client`
- **Auth hooks** dari `@/hooks/useAuth` dan `@/hooks/useRole`
- **Styling** pakai Tailwind CSS + shadcn/ui — komponen UI ada di `src/components/ui/`
- **Server state** pakai TanStack Query (`useQuery`, `useMutation`) — bukan `useEffect` + `fetch`
- **Toast** pakai `sonner` (`import { toast } from "sonner"`) — bukan shadcn toast
- **Path alias** `@/` = `src/` (dikonfigurasi di `vite.config.ts`)
- **Bahasa UI** Indonesia — semua label, pesan error, dan teks UI dalam Bahasa Indonesia

### File Kunci yang Sering Diedit
```
src/pages/ManagementDashboard.tsx  ← dashboard owner + admin
src/pages/KaryawanDashboard.tsx    ← dashboard karyawan (5 tab)
src/hooks/useRole.ts               ← role detection + retry logic
src/hooks/useAuth.ts               ← session management
src/lib/auth.ts                    ← signIn, signUp, createUserWithRole
src/integrations/supabase/types.ts ← database types (jangan edit manual)
src/App.tsx                        ← routing + RoleGuard
```

### Hal yang JANGAN Dilakukan
- Jangan pakai `useEffect` untuk fetch data — gunakan `useQuery` dari TanStack Query
- Jangan insert ke `user_roles` dari client secara langsung — gunakan `createUserWithRole()` di `src/lib/auth.ts`
- Jangan edit `src/integrations/supabase/types.ts` secara manual untuk tabel baru — update via migration + regenerate
- Jangan pakai `localStorage` untuk data penting — sudah ada Supabase
- Jangan buat route baru tanpa `RoleGuard` di `App.tsx`

### Konteks Database Penting
- Semua tabel pakai **Row Level Security (RLS)** — query yang gagal tanpa error biasanya karena RLS, bukan bug kode
- `user_roles` punya constraint UNIQUE per `user_id` — satu user hanya boleh punya satu role
- Trigger `handle_new_user` otomatis jalan saat signup — tidak perlu insert manual ke `profiles` atau `user_roles`
- `has_role(user_id, role)` adalah fungsi DB security definer — gunakan ini di RLS policy, bukan query langsung

### State Saat Ini (Akhir Sesi Terakhir)
- ✅ Login berfungsi untuk semua 3 role
- ✅ ManagementDashboard berfungsi untuk owner dan admin
- ✅ KaryawanDashboard berfungsi dengan 5 tab
- ✅ Landing Page publik tersedia di route `/` (`src/pages/LandingPage.tsx`)
- ✅ Design system "Dark Futuristic Elegant" diimplementasikan di `index.css` + `tailwind.config.ts`
- ✅ Dark/Light mode toggle di Landing Page (ThemeProvider + next-themes)
- ✅ Migration `20260508000001_add_products_table.sql` dibuat (perlu `supabase db push` ke Supabase)
- ✅ Admin Product CRUD fungsional — `ProductManagement.tsx` + `useProducts.ts` (M-03 selesai)
- ✅ Tab "Toko" Karyawan membaca dari Supabase `products` table — localStorage dihapus (M-04 selesai)
- ✅ WhatsApp message builder otomatis di Tab Toko (format pesan lengkap dengan spesifikasi produk)
- ✅ Lint clean — 0 errors (file deprecated dihapus, semua `any` diganti tipe eksplisit)
- ✅ Owner Dashboard: period filter (Hari Ini/Minggu/Bulan/Kustom) + delta cards via `OwnerPeriodStats`
- ✅ Owner PDF Export: tombol "Export PDF" di `OwnerPeriodStats` via `window.print()` + `@media print` CSS
- ✅ Karyawan Target Progress + Estimasi Bonus: `TargetProgress.tsx` dengan animated progress bar, proyeksi unit, dan estimasi bonus real-time dari `incentive_config`
- ✅ Owner Analytics: `SellerProfitChart` (horizontal bar), `MonthlyTrendChart` (area 6 bulan), `SellerLeaderboard` (sortable + top badge + CSV export) — tab "Analitik" baru di ManagementDashboard
- ✅ Edge Functions deployed: `predict-price` (heuristic engine, 80+ model) + `lookup-imei` (TAC DB, 50+ perangkat)
- ✅ Bugfix: tombol "Tambah Jurnal" di tab Transaksi karyawan sekarang muncul dan berfungsi
- ✅ Form produk Admin direfactor: OS→Brand→Model dependent dropdowns, Model combobox searchable, Penyimpanan/RAM select fixed, format ribuan di input harga
- ✅ Device database `device-data.ts` diperluas: 1.400+ model dari 21 brand (Samsung, Xiaomi, Redmi, OPPO, Vivo, Realme, Infinix, Tecno, ASUS, Google, OnePlus, Motorola, Sony, Honor, Nokia, Huawei, Meizu, ZTE, Lenovo, BlackBerry, Apple)
- ✅ Google OAuth + Approval Flow: `signInWithGoogle()`, `PendingApproval.tsx`, tab pending di UserManagement, migration `is_approved`
- ✅ Sistem Testimoni Termoderasi: form publik text-only, admin moderation + photo upload, dynamic landing page display
- ⚠️ Google OAuth perlu dikonfigurasi di Supabase Dashboard → Authentication → Providers → Google (tambahkan Client ID & Secret)
- ⚠️ Buat Storage bucket 'testimonials' di Supabase Dashboard → Storage → New Bucket → Public: true
- ✅ SEO & Open Graph: `index.html` lengkap — title, description, og:*, twitter:card, theme-color, canonical, semantic HTML (`<header>/<main>/<footer>`)
- ⚠️ Edge Functions perlu di-deploy ke Supabase: `supabase functions deploy predict-price --no-verify-jwt && supabase functions deploy lookup-imei --no-verify-jwt`
- ⚠️ OG image masih `/placeholder.svg` — ganti dengan gambar 1200×630 nyata sebelum launch
- ⚠️ Canonical URL diupdate ke `https://www.iku-gadget.com/`
- ⏳ M-08: QA semua role, RLS audit, mobile responsiveness — belum dimulai
- ✅ Semua deprecated files dihapus: `OwnerDashboard.tsx`, `AdminDashboard.tsx`, `Dashboard.tsx`, `LoginScreen.tsx`, `SellerManagement.tsx`, folder `karyawan/ui/` (49 file)
- ⚠️ Tab "AI Prediksi" dan "Cek IMEI" butuh Edge Function yang belum di-deploy

---

## Ringkasan Sesi Pengembangan

Proyek ini dimulai dari Project B yang sudah ada (Vite + React + Supabase) dengan role `admin` dan `seller`. Sepanjang sesi ini dilakukan migrasi penuh ke arsitektur 3-tier, integrasi komponen dari Project A (`gadget-sales-buddy`), dan berbagai perbaikan bug.

### Kronologi Perubahan

1. **Ekspansi Role** — Enum `app_role` diubah dari `('admin','seller')` menjadi `('owner','admin','karyawan')`. Data lama `seller` otomatis dimigrasikan ke `karyawan`.
2. **RLS 3-Tier** — Semua policy di-rebuild: owner dapat ALL tanpa filter, admin CRUD penuh, karyawan hanya INSERT+SELECT data sendiri.
3. **Halaman per Role** — Dibuat `OwnerDashboard`, `AdminDashboard`, `KaryawanDashboard` (kemudian direfactor).
4. **Route Guards** — `App.tsx` dilengkapi `RoleGuard` + `Index.tsx` sebagai role-dispatcher.
5. **ManagementDashboard** — `OwnerDashboard` dan `AdminDashboard` digabung menjadi satu komponen `ManagementDashboard.tsx`. Owner dan admin share view yang sama, UI dikondisikan via `useRole()`.
6. **Profiles + User Management** — Tabel `profiles` ditambahkan. Trigger `handle_new_user` otomatis insert ke `profiles` + `user_roles` saat signup. Komponen `UserManagement.tsx` dibuat untuk owner/admin kelola akun.
7. **Fix Race Condition** — `useAuth` dan `useRole` diperbaiki untuk menghindari flash "Akun belum memiliki role" saat login. `useRole` sekarang retry 4x dengan delay bertahap.
8. **Fix Invalid API Key** — `.env` diperbaiki dengan anon key JWT lengkap. `client.ts` dan `Login.tsx` ditambahkan validasi dini + banner error.
9. **Seeding Akun** — 3 akun production dibuat via Supabase Dashboard, email dikonfirmasi, role di-assign via `npx supabase db query`.
10. **Migrasi KaryawanDashboard dari Project A** — Komponen `Dashboard.tsx`, `TransactionTable.tsx`, `OnlineStore.tsx`, `SellerChart.tsx`, `PricePrediction.tsx`, `ImeiChecker.tsx`, `DarkModeToggle.tsx` dicopy dari `gadget-sales-buddy` ke `src/components/karyawan/`. `KaryawanDashboard.tsx` direbuild dengan tab navigation 5 tab.
11. **Warna & Styling** — Stat cards karyawan diberi warna hardcoded (hijau/oranye/biru/merah). Tab navigation diubah ke green solid pill style. `tailwind.config.ts` ditambah token `chart-unit`.
12. **Clean Architecture** — Folder `src/features/` dibuat sebagai barrel exports per domain. Folder `src/types/` dibuat untuk shared domain types.
13. **Dark/Light Mode Landing Page** — `ThemeProvider` dari `next-themes` ditambahkan di `main.tsx`. Komponen `LandingDarkModeToggle.tsx` dibuat untuk toggle di navbar. Semua section Landing Page diupdate dengan Tailwind classes yang support `dark:` prefix. Default theme: dark.
14. **Admin Product CRUD + Karyawan Tab Toko DB Migration** — `useProducts.ts` hook dibuat dengan 4 mutations (fetch/add/update/delete). `ProductManagement.tsx` dibuat untuk Admin dengan tabel produk, form add/edit (React Hook Form + Zod), stock adjustment dialog, dan delete confirmation. `OnlineStore.tsx` di-refactor total: localStorage dihapus, diganti `useProducts` hook, WhatsApp message builder otomatis dengan format pesan lengkap. Tab "Stok Produk" ditambahkan ke `ManagementDashboard`. `KaryawanDashboard.tsx` dibersihkan dari semua localStorage logic.
15. **Lint & TypeScript Cleanup** — Hapus 4 file deprecated yang tidak dipakai: `AdminDashboard.tsx`, `Dashboard.tsx`, `LoginScreen.tsx` (Project A), `SellerManagement.tsx` (Project A). Fix semua `no-explicit-any` dengan `unknown` + cast atau tipe eksplisit. Fix `no-empty-object-type` di `command.tsx` dan `textarea.tsx` (kedua copy ui/ dan karyawan/ui/). Fix `no-require-imports` di `tailwind.config.ts` dengan ESM import. Hasil akhir: `npm run lint` → 0 errors, 14 warnings (semua dari shadcn boilerplate yang tidak bisa diubah).
16. **Owner Period Filter + Delta Cards + Final Cleanup** — Hapus `OwnerDashboard.tsx` dan seluruh folder `src/components/karyawan/ui/` (49 file duplikat shadcn dari Project A). Buat `OwnerPeriodStats.tsx` di `src/components/owner/`: period selector pill (Hari Ini/Minggu Ini/Bulan Ini/Kustom dengan date range picker), 4 stat cards (Profit Toko 50%, Total Transaksi, Unit Terjual, Seller Aktif), delta badge per card (% change vs periode sebelumnya, division-by-zero safe), profit breakdown row (Penjualan/Modal/Profit Kotor). Diintegrasikan ke `ManagementDashboard` — owner mendapat `OwnerPeriodStats`, admin tetap simple cards. Lint: 0 errors, 7 warnings.
17. **Owner PDF Export + Karyawan Target Progress & Bonus** — `OwnerPeriodStats`: tambah tombol "Export PDF" (Printer icon), `@media print` CSS di `index.css` (A4 landscape, print header dengan nama toko + range tanggal + timestamp, `.no-print` class menyembunyikan controls dan delta badges). `TargetProgress.tsx` dibuat: fetch `incentive_config` via TanStack Query, filter transaksi bulan berjalan, animated progress bar (CSS transition 600ms ease-out dari `index.css`), 3 mini-cards (Profit Bagian Kamu 50%, Estimasi Bonus jika target tercapai, Proyeksi Unit linear), motivational footer dinamis berdasarkan % progress. Diintegrasikan ke `KaryawanDashboard` di atas tab navigation.
18. **Owner Advanced Analytics** — 3 komponen baru di `src/components/owner/`: `SellerProfitChart.tsx` (horizontal BarChart Recharts, sorted descending, gradient opacity, custom dark tooltip), `MonthlyTrendChart.tsx` (AreaChart 6 bulan terakhir, dual area Penjualan+Profit, gradient fill, custom dark tooltip), `SellerLeaderboard.tsx` (menggantikan `SellerAnalytics` inline — sortable 4 kolom dengan asc/desc toggle, Trophy/Medal rank icons, Top Performer badge + glow untuk #1 bulan ini, Export CSV button). Tab "Analitik" baru ditambahkan ke ManagementDashboard (owner only). Lint: 0 errors, 7 warnings.
19. **Edge Functions: predict-price + lookup-imei** — `supabase/functions/predict-price/index.ts`: Deno server dengan heuristic price engine — base price table 80+ model dari 6 brand (iPhone, Samsung, Xiaomi, OPPO, Vivo, Realme), kondisi multiplier 5 tier, storage premium, battery health deduction, year depreciation 8%/tahun, brand-tier fallback untuk model tidak dikenal, tips negosiasi dinamis. `supabase/functions/lookup-imei/index.ts`: Deno server dengan TAC database 50+ perangkat populer Indonesia (Apple, Samsung, Xiaomi/Redmi/POCO, OPPO, Vivo, ASUS ROG, Google Pixel), fuzzy 7-digit prefix fallback, graceful unknown response. Kedua fungsi: CORS headers lengkap, `Deno.serve()`, validasi input, typed error handling. Frontend sudah menggunakan `supabase.functions.invoke()` — tidak ada perubahan frontend diperlukan.
20. **SEO & Semantic HTML (M-07 selesai)** — `index.html` diupdate lengkap: `lang="id"`, title SEO-friendly, meta description dari copy Hero, keywords, robots, theme-color (#070d1a), canonical URL placeholder, og:type/locale/site_name/url/title/description/image/dimensions, twitter:card lengkap, preconnect Google Fonts. OG image diganti ke `/placeholder.svg` (URL Lovable lama expired). `LandingPage.tsx`: `<header>` wraps `LandingNav`, `<main>` wraps content sections, `<LandingFooter>` di luar `<main>`, footer logo `loading="lazy"`. PRD status: Feature Complete — Pending QA.
21. **Bugfix KaryawanDashboard + UX improvements** — Tombol "Tambah Jurnal" tidak muncul di tab Transaksi karyawan karena `addEntry` useMutation tidak pernah di-trigger. Fix: hapus mutation yang tidak terpakai, import `JournalForm` langsung, tambah `refresh` helper. Juga: format ribuan (titik pemisah) di input Harga Jual/Beli/Biaya Operasional pada `JournalForm`, dan `DarkModeToggle` ditambahkan ke header `ManagementDashboard`.
22. **Product Form UX Overhaul** — `src/lib/device-data.ts` dibuat: database hierarkis OS→Brand→Model dengan 300+ model dari 18 brand. Form `ProductManagement.tsx` direfactor total: Select OS (iOS/Android) sebagai root, Select Merk dependent pada OS, Combobox Model searchable (Popover+Command shadcn) dependent pada Merk, Select Penyimpanan & RAM dengan opsi fixed, input Harga Beli & Harga Jual dengan format titik ribuan real-time + prefix Rp, Zod schema diupdate dengan `superRefine` untuk validasi harga.
23. **Device Database Expansion** — `device-data.ts` diperluas dari ~300 menjadi 1.400+ model dari 21 brand. Penambahan lengkap: Samsung (Note/M/F/Tab), Xiaomi (Mi lama + POCO semua seri), Redmi (Note 1-13 + K + A series), OPPO (F/A/K lengkap), Vivo (Y/S/iQOO semua seri), Realme (C/Narzo/Q), Infinix (Hot/Smart/GT), Tecno (Spark/Pop/Pova), ASUS (ROG/Zenfone semua generasi), Google (Pixel 1-8 Fold), OnePlus (Nord/CE/N), Motorola (Edge/Razr/Moto E), Sony (Xperia semua), Honor (Magic/numbered/X/Play), Nokia (G/C/X/numbered), Huawei (P/Mate/Nova/Y), Meizu (15-21), ZTE (Axon/Blade/nubia/Red Magic), Lenovo (Legion/K/Z), BlackBerry (9 model). Apple: 46 iPhone (4 s/d 16 Pro Max) + 30 iPad semua generasi.
24. **Google OAuth + Approval Flow** — Migration `20260510000001`: kolom `is_approved` di `profiles`, trigger `handle_new_user` diupdate (admin-created=true, self-register/OAuth=false), RPC `approve_user()` dan `get_pending_users()`. `auth.ts`: `signInWithGoogle()` via Supabase OAuth. `useRole.ts`: fetch `is_approved` paralel. `PendingApproval.tsx`: lock screen untuk user pending. `Login.tsx`+`Register.tsx`: tombol Google dengan SVG icon. `App.tsx` RoleGuard: intercept `isApproved === false`. `UserManagement.tsx`: tab "Menunggu Persetujuan" dengan `ApproveUserDialog`. `seed_dummy.sql`: 26 produk + 36 transaksi 3 bulan untuk Dani & Budi.
25. **Sistem Testimoni Termoderasi** — Migration `20260514000001`: tabel `testimonials` + RLS (public INSERT, public SELECT approved, admin full CRUD). `TestimonialForm.tsx`: form publik text-only (Zod: nama max 50, ulasan max 250, star rating). `TestimonialModeration.tsx`: panel admin — list pending/approved, ApproveDialog + optional photo upload ke Supabase Storage. `LandingPage.tsx` TestimonialsSection direfactor: fetch approved via TanStack Query, render dinamis + foto, skeleton loader, fallback statis. Tab "Moderasi Ulasan" di ManagementDashboard. Keamanan: no dangerouslySetInnerHTML, Zod sanitasi, file upload admin-only.
26. **Landing Page UI/UX Enhancements** — `index.css`: smooth scrolling global, reduced-motion media query, keyframe `glow-pulse`, utility `.reveal` + staggered delays. Hook `useScrollReveal.ts` (native Intersection Observer). `LandingPage.tsx`: Hero CTA `animate-glow-pulse`, semua section pakai scroll-reveal fade-up, cards hover lift + branded shadow, step circles group hover glow. Storage policies migration `20260514000002`.
27. **Testimonial Moderation + COD Business Model** — `TestimonialModeration.tsx`: tombol "Sembunyikan" (revert ke pending) dan "Hapus" (delete permanen) untuk ulasan live. `LandingPage.tsx`: copywriting diubah ke model COD online — Cara Kerja (Chat WA → Nego Online → COD), "Fast Response 6 Hari", CTA "atur jadwal COD", alamat fisik dihapus → "Melayani COD area Malang & sekitarnya".
28. **Import Excel Jurnal** — `JournalFilters.tsx`: tombol "Import Excel" dengan file picker (.xlsx/.xls/.csv), parsing SheetJS, flexible column mapping (support header Indonesia/Inggris), price stripping (Rp/titik/koma→angka), date parsing multi-format (DD/MM/YYYY, ISO, Excel serial number), validasi kolom wajib, bulk insert Supabase, toast loading/success/error, auto-refresh via TanStack Query invalidation.
29. **Landing Page Major Redesign — Classic Minimalist Gold** — `index.css`: CSS scope `.landing-theme` (tidak mempengaruhi dashboard) dengan token `--lp-bg/card/elevated/fg/fg-muted/border/gold`, light (#FAFAFA/#121212) dan dark (#0A0A0A/#F5F5F5), gold #D4AF37, keyframe `gold-glow-pulse`, `.gold-card-border`, `.lp-connector`. `tailwind.config.ts`: `brand-gold` tokens. `LandingPage.tsx`: semua warna hijau/neon dihapus, Hero gold badge + gold CTA `animate-gold-glow`, semua section pakai `--lp-*` CSS variables, `font-display` (Sora) pada heading.
30. **Full Monochrome Design System** — Hijau dihapus dari seluruh app (bukan hanya landing). `index.css`: `--primary` global diubah ke monochrome (light: hitam `0 0% 9%`, dark: putih `0 0% 96%`). Semua background dari blue-tinted ke pure black/white. Glow effects, border-gradient, surface layers semua monochrome. Landing page `.landing-theme` diupdate: gold → `--lp-accent` (hitam/putih). `tailwind.config.ts`: `bg-surface`/`bg-elevated` ke pure grayscale. Warna tersisa: destructive (merah) dan accent-orange (warning saja).
31. **Dynamic Profit-Sharing per Seller** — Migration `20260515000001`: `profiles.komisi_persen` (default 50%), `journal.komisi_persen_applied` + `journal.nominal_komisi`, backfill data lama. `UserManagement.tsx`: `CommissionEditor` dropdown 30-70% per karyawan. `JournalForm.tsx`: fetch komisi dari profile, preview dinamis, submit menyimpan applied % + nominal. `TargetProgress.tsx`: pakai `nominal_komisi` jika tersedia, fallback 50%.
32. **Pemisahan Alur Barang Masuk / Keluar** — Migration `20260515000002`: RLS karyawan INSERT products + RPC `deduct_product_stock`. `FormBarangMasuk.tsx`: form catat kulakan (Merk/Model/Kondisi/Storage/RAM/Harga Beli/Harga Jual rencana → insert products stok=1). `JournalForm.tsx`: "Nama Unit" diganti Select dari products stok>0, auto-fill Harga Beli (read-only), submit → insert journal + deduct stock via RPC. `KaryawanDashboard.tsx`: tombol "Catat Barang Masuk" di tab Transaksi.
33. **JournalForm Transaction Type Toggle** — `JournalForm.tsx`: segmented control "Catat Penjualan" / "Catat Pembelian". Penjualan: product selector dari stok, Harga Beli read-only, Harga Jual editable, profit preview + komisi, stock deduction. Pembelian: input Nama Unit manual, Harga Beli saja (Harga Jual=0), preview "Total Pengeluaran" (minus). Conditional rendering — payload DB tetap sama.
34. **Smart IMEI Lookup API Router** — Edge Function `lookup-imei` direfactor: Primary imei.org → Apple chain ifreeicloud.co.uk (FMI check) → Fallback imei.info → Last resort local TAC DB. Luhn server-side. Unified response `{ success, is_apple, brand, model, details, apple_icloud_status?, source }`. API keys via Deno secrets. Frontend `ImeiChecker.tsx`: Apple iCloud Status card otomatis, source info.
35. **AI Chatbot + Owner API Key Management** — Migration `20260516000001`: tabel `site_settings` (gemini_api_key, owner-only RLS) + `rate_limits` (IP tracking). Edge Function `ai-assistant`: fetch Gemini key dari DB, IP rate limit (15/jam), call Google Gemini 1.5 Flash API, system prompt konteks Iku Gadget. `ChatAssistant.tsx`: FAB bottom-right, Sheet sidebar, greeting + quick topics, message history, loading state. `AiSettings.tsx`: Owner form input/save Gemini API key. Tab "AI Settings" di ManagementDashboard (owner only). Logo landing page dibuat responsive (`w-40 md:w-52 lg:w-60`).

---

## 1. Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | React 18 + Vite 5 (SWC) |
| **Language** | TypeScript 5 |
| **Routing** | React Router DOM v6 |
| **Server State** | TanStack React Query v5 |
| **UI Library** | shadcn/ui (Radix UI primitives + Tailwind CSS v3) |
| **Forms** | React Hook Form v7 + Zod v3 |
| **Charts** | Recharts v2 |
| **Backend/Auth** | Supabase (PostgreSQL + Auth + Realtime) |
| **Notifications** | Sonner + shadcn Toaster |
| **Testing** | Vitest + Testing Library + Playwright |

State management murni React + TanStack Query — tidak ada Redux/Zustand.

---

## 2. Arsitektur Role (3-Tier)

```
owner    ──►  Kontrol absolut. Full CRUD semua tabel, analytics global, kelola semua pengguna.
admin    ──►  Manajemen operasional. Full CRUD jurnal, konfigurasi insentif, kelola karyawan.
karyawan ──►  Operasional harian. INSERT transaksi sendiri, SELECT data milik sendiri saja.
```

### Enum
```sql
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'karyawan');
```

### Aturan Pembuatan Akun
| Pembuat | Bisa buat role |
|---|---|
| **Owner** | admin, karyawan |
| **Admin** | karyawan saja |
| **Registrasi publik** | karyawan saja (default) |

### Akun Aktif (Production)
| Email | Role | Status | Redirect |
|---|---|---|---|
| `owner_arya@gmail.com` | owner | ✅ confirmed | `/owner` → ManagementDashboard |
| `admin_bagus@gmail.com` | admin | ✅ confirmed | `/admin` → ManagementDashboard |
| `karyawan_dani@gmail.com` | karyawan | ✅ confirmed | `/karyawan` → KaryawanDashboard |

> Password sesuai yang diset saat pembuatan akun di Supabase Dashboard.

---

## 3. Skema Database & RLS

### Tabel

#### `profiles`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK → `auth.users` | ON DELETE CASCADE |
| `full_name` | TEXT | nullable |
| `email` | TEXT | nullable |
| `created_at` / `updated_at` | TIMESTAMPTZ | auto-update via trigger |

**RLS:** owner → ALL | admin → SELECT+UPDATE semua | user sendiri → SELECT+UPDATE milik sendiri | INSERT via trigger signup

#### `journal`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | auto |
| `user_id` | UUID FK → `auth.users` | ON DELETE CASCADE |
| `tanggal` | DATE | default `CURRENT_DATE` |
| `nama_seller` | TEXT | |
| `jenis_unit` | TEXT | default `'HP'` |
| `nama_unit` | TEXT | |
| `harga_jual` | NUMERIC | |
| `harga_beli` | NUMERIC | |
| `biaya_operasional` | NUMERIC | default `0` |
| `keterangan_biaya` | TEXT | nullable |
| `created_at` / `updated_at` | TIMESTAMPTZ | auto-update via trigger |

**RLS:**
| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `owner` | ✅ semua | ✅ | ✅ | ✅ |
| `admin` | ✅ semua | ✅ | ✅ | ✅ |
| `karyawan` | ✅ milik sendiri | ✅ milik sendiri | ❌ | ❌ |

#### `user_roles`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → `auth.users` | ON DELETE CASCADE |
| `role` | `app_role` | UNIQUE per user |

**RLS:** owner → ALL | admin → SELECT semua + INSERT/DELETE karyawan saja | user sendiri → SELECT milik sendiri | self-register → INSERT `'karyawan'` saja
**Trigger `enforce_single_admin`**: mencegah lebih dari 1 admin

#### `seller_visits`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `seller_user_id` | UUID | |
| `seller_email` | TEXT | |
| `visited_at` | TIMESTAMPTZ | default `now()` |
| `seen` | BOOLEAN | default `false` |

**RLS:** owner → ALL | admin → SELECT+UPDATE | karyawan → INSERT+SELECT milik sendiri
**Realtime enabled** via `supabase_realtime` publication

#### `incentive_config`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `target_units` | INTEGER | default `20` |
| `bonus_percentage` | NUMERIC | default `5` |
| `updated_at` | TIMESTAMPTZ | |
| `updated_by` | UUID | nullable |

**RLS:** owner → ALL | admin → SELECT+UPDATE | karyawan → SELECT

### DB Functions
```sql
has_role(_user_id uuid, _role app_role) RETURNS boolean
-- Security definer, cek role tanpa expose user_roles langsung

handle_new_user() RETURNS TRIGGER
-- Otomatis INSERT profiles + user_roles saat signup
-- Baca raw_user_meta_data->>'role' dan ->>'full_name'

get_user_list() RETURNS TABLE(user_id, email, full_name, role, created_at)
-- Hanya owner/admin, join profiles + user_roles

assign_role_to_user(_target_user_id uuid, _role app_role) RETURNS void
-- Owner: bisa assign semua role | Admin: hanya karyawan

remove_user_role(_target_user_id uuid) RETURNS void
-- Owner: hapus siapa saja | Admin: hanya karyawan
```

---

## 4. Fitur & Routing

### Routing (`src/App.tsx`)
```
/           → LandingPage.tsx         PUBLIC — halaman publik toko (tanpa auth)
/dashboard  → Index.tsx               role-dispatch ke /owner, /admin, /karyawan
/login      → Login.tsx               env validation banner + error handling spesifik
/register   → Register.tsx            self-register, auto-assign 'karyawan'
/owner      → ManagementDashboard     [RoleGuard: owner only]
/admin      → ManagementDashboard     [RoleGuard: admin only]
/karyawan   → KaryawanDashboard       [RoleGuard: karyawan only]
*           → NotFound.tsx
```

> **Catatan:** Login dan Register setelah sukses redirect ke `/dashboard` (bukan `/`). RoleGuard redirect ke `/dashboard` jika role tidak sesuai.

### ManagementDashboard — Fitur Kondisional
| Fitur | Owner | Admin |
|---|---|---|
| Summary cards | ✅ profit toko 50% | ✅ total profit |
| Secondary stats row (bulan ini) | ✅ | ❌ |
| Tab "Performa Seller" (leaderboard) | ✅ | ❌ |
| Tab "Jurnal Penjualan" (CRUD) | ✅ | ✅ |
| Tab "Kelola Pengguna" | ✅ admin+karyawan | ✅ karyawan saja |
| Notifikasi realtime kunjungan | ✅ | ✅ |
| Edit incentive config | ✅ | ✅ |
| Grafik penjualan mingguan | ✅ | ✅ |

### KaryawanDashboard — 5 Tab
| Tab | Konten |
|---|---|
| **Transaksi** | Tabel jurnal milik sendiri (read-only, RLS enforced) |
| **Toko** | Online store produk, beli via WhatsApp (localStorage per-user) |
| **Analitik** | Bar chart performa seller (Recharts) |
| **AI Prediksi** | Estimasi harga beli/jual gadget bekas via Edge Function `predict-price` |
| **Cek IMEI** | Validasi Luhn + lookup perangkat via Edge Function `lookup-imei` |

Header karyawan: logo + badge PRO + email + dark mode toggle + logout.
Stat cards: Total Profit 🟢 | Bagian Investor 🟠 | Transaksi 🔵 | Seller Aktif 🔴
Tab aktif: green solid pill. Tab tidak aktif: plain text abu-abu.

---

## 5. Struktur File

```
src/
├── pages/
│   ├── Index.tsx                # Role-dispatch (di-serve di /dashboard)
│   ├── LandingPage.tsx          # ← BARU: halaman publik toko (route /)
│   ├── ManagementDashboard.tsx  # Owner + Admin shared view
│   ├── KaryawanDashboard.tsx    # 5-tab karyawan view
│   ├── Login.tsx                # + env validation banner
│   ├── Register.tsx             # + field nama lengkap
│   └── NotFound.tsx
│
├── components/
│   ├── landing/                 # Landing page components
│   │   └── DarkModeToggle.tsx   # Dark/light toggle untuk landing page
│   ├── karyawan/                # Migrasi dari Project A (gadget-sales-buddy)
│   │   ├── Dashboard.tsx        # 4 stat cards berwarna
│   │   ├── TransactionTable.tsx # Tabel transaksi
│   │   ├── OnlineStore.tsx      # Grid produk dari Supabase + WhatsApp builder
│   │   ├── SellerChart.tsx      # Bar chart Recharts
│   │   ├── PricePrediction.tsx  # AI harga via Edge Function
│   │   ├── ImeiChecker.tsx      # Luhn + AI lookup
│   │   └── DarkModeToggle.tsx   # Dark/light toggle untuk dashboard karyawan
│   ├── admin/                   # ← BARU: komponen khusus admin
│   │   └── ProductManagement.tsx # CRUD produk (tabel + form + stock dialog)
│   ├── UserManagement.tsx       # Buat/hapus akun (role-aware)
│   ├── JournalForm.tsx          # Dialog tambah/edit jurnal
│   ├── JournalTable.tsx         # Tabel jurnal + edit/hapus
│   ├── JournalFilters.tsx       # Filter + export Excel
│   ├── WeeklySalesChart.tsx     # Line chart mingguan
│   ├── IncentivePanel.tsx       # Progress target + config
│   ├── NotificationBell.tsx     # Realtime kunjungan karyawan
│   ├── MotivationalQuote.tsx    # Quote harian
│   └── ui/                      # shadcn/ui (40+ komponen)
│
├── features/                    # Barrel exports per domain
│   ├── auth/                    # useAuth, useRole, auth functions
│   ├── journal/                 # JournalForm, Table, Filters
│   ├── analytics/               # Charts, IncentivePanel, Quote
│   └── users/                   # UserManagement, NotificationBell
│
├── types/
│   └── journal.ts               # JournalEntry, SellerStat, formatRp, calcProfit
│
├── hooks/
│   ├── useAuth.ts               # getSession() first, retry-safe
│   ├── useRole.ts               # Retry 4x, wait authLoading
│   ├── useProducts.ts           # ← BARU: CRUD products table (useQuery + 3 useMutation)
│   └── useSellerVisitLogger.ts  # Auto-log visit karyawan
│
├── lib/
│   ├── auth.ts                  # signIn, signUp, signOut, createUserWithRole
│   └── utils.ts                 # cn()
│
└── integrations/supabase/
    ├── client.ts                # createClient + key length validation
    └── types.ts                 # Database types + RPC signatures
```

---

## 6. Konfigurasi Warna — Dark Futuristic Elegant

Design system diperbarui ke estetika **"Dark Futuristic Elegant"** (M-06 PRD v1.0.0).

### `src/index.css` — Token Utama (dark mode)
```css
/* Backgrounds */
--background:     222 47% 6%;   /* Hampir hitam-biru */
--card:           222 40% 10%;  /* Surface card */
--secondary:      222 35% 14%;  /* Elevated / hover */

/* Brand */
--primary:        160 70% 45%;  /* Hijau neon halus (CTA, success) */
--chart-unit:     200 90% 55%;  /* Biru (info, highlight) */
--brand-secondary: 200 90% 55%; /* Alias untuk chart-unit */
--accent-orange:  28 90% 55%;   /* Warning, investasi */
--accent-red:     0 72% 55%;    /* Error, danger */

/* Text */
--foreground:     210 40% 95%;  /* Hampir putih */
--muted-foreground: 215 20% 65%; /* Label, subtitle */

/* Border */
--border:         215 30% 20%;  /* Garis card dan divider */
```

### `tailwind.config.ts` — Token Tambahan
```ts
"chart-unit":      { DEFAULT: "hsl(var(--chart-unit))" }
"brand-secondary": { DEFAULT: "hsl(var(--brand-secondary))" }
"accent-orange":   { DEFAULT: "hsl(var(--accent-orange))" }
"accent-red":      { DEFAULT: "hsl(var(--accent-red))" }
"bg-surface":      "hsl(222 40% 10%)"
"bg-elevated":     "hsl(222 35% 14%)"

// Font families
fontFamily: {
  sans:    ["Inter", "system-ui", "sans-serif"]
  mono:    ["JetBrains Mono", "Courier New", "monospace"]
  display: ["Sora", "Inter", "sans-serif"]
}
```

### Theme Provider Setup
Landing page menggunakan `next-themes` untuk dark/light mode switching:
- **Provider:** `ThemeProvider` di `src/main.tsx` dengan `attribute="class"` dan `defaultTheme="dark"`
- **Toggle:** `LandingDarkModeToggle` component di navbar landing page
- **Persistence:** Theme preference disimpan di localStorage
- **System support:** Bisa follow system preference jika user belum set manual

### Utility Classes Baru (`index.css`)
```
.glow-primary      → box-shadow glow hijau (CTA buttons)
.glow-primary-sm   → glow halus untuk card hover
.glass             → glassmorphism (backdrop-blur + semi-transparent bg)
.border-gradient   → border gradient hijau-biru
.noise-overlay     → noise texture subtle via CSS (hero section)
.animate-fade-up   → entrance animation dari bawah (landing page)
.animate-fade-up-delay-{1,2,3} → staggered delays
```

### Stat Cards Karyawan (inline HSL — tidak berubah)
```
Total Profit    → hsl(160 60% 40%)  hijau
Bagian Investor → hsl(28 90% 50%)   oranye
Transaksi       → hsl(200 80% 48%)  biru
Seller Aktif    → hsl(0 72% 50%)    merah
```

---

## 7. Migrations (urutan wajib)

| # | File | Isi |
|---|---|---|
| 1 | `20260406213154` | Tabel `journal` + RLS + trigger `updated_at` |
| 2 | `20260406213834` | Enum `app_role`, tabel `user_roles`, `has_role()` |
| 3 | `20260406213955` | Policy self-insert role |
| 4 | `20260406214856` | Trigger `enforce_single_admin`, tabel `seller_visits` + Realtime |
| 5 | `20260406215604` | Tabel `incentive_config` + seed default |
| 6 | `20260421121259` | Patch: batasi self-insert ke `'seller'` |
| 7 | `20260501000000` | **Role expansion**: `seller`→`karyawan`, tambah `owner`, rebuild RLS |
| 8 | `20260501000001` | **Owner full access**: ALL tanpa filter di semua tabel |
| 9 | `20260501000002` | **Profiles + User Mgmt**: tabel `profiles`, trigger `handle_new_user`, `get_user_list`, `assign_role_to_user`, `remove_user_role` |
| 10 | `20260508000001` | **Products table**: tabel `products` + RLS (owner/admin ALL, karyawan SELECT) + trigger `updated_at` |

**Bug fix di migration 9:** policy `WITH CHECK` pakai `role = 'karyawan'` bukan `NEW.role` (NEW tidak valid di RLS expression).

---

## 8. Seeding & Setup Akun

Akun dibuat manual via Supabase Dashboard → perlu fix via CLI:

```bash
# Confirm email
npx supabase db query "UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email_confirmed_at IS NULL;" --linked

# Assign roles
npx supabase db query "
  INSERT INTO public.user_roles (user_id, role) SELECT id, 'owner' FROM auth.users WHERE email = 'owner_arya@gmail.com' ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) SELECT id, 'admin' FROM auth.users WHERE email = 'admin_bagus@gmail.com' ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) SELECT id, 'karyawan' FROM auth.users WHERE email = 'karyawan_dani@gmail.com' ON CONFLICT DO NOTHING;
" --linked

# Backfill profiles
npx supabase db query "INSERT INTO public.profiles (id, email, full_name) SELECT id, email, email FROM auth.users ON CONFLICT (id) DO NOTHING;" --linked

# Hapus role duplikat
npx supabase db query "
  DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'owner_arya@gmail.com') AND role = 'karyawan';
  DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin_bagus@gmail.com') AND role = 'karyawan';
" --linked
```

**Hasil akhir:**
```
owner_arya@gmail.com    → owner    ✅
admin_bagus@gmail.com   → admin    ✅
karyawan_dani@gmail.com → karyawan ✅
```

---

## 9. Troubleshooting

### "Akun belum memiliki role" setelah login
Race condition `useAuth` vs `useRole`. **Fix:** `useAuth` pakai `getSession()` sebagai sumber pertama. `useRole` menunggu `authLoading` selesai, retry 4x delay 600ms, retry juga saat `data === null`.

### "Invalid API key"
`VITE_SUPABASE_PUBLISHABLE_KEY` terpotong. **Fix:** Salin ulang anon key JWT lengkap (~200+ karakter) dari Supabase Dashboard → Project Settings → API. Banner merah otomatis muncul di Login jika key < 100 karakter.

### Login berhasil tapi halaman kosong / "belum memiliki role"
Row `user_roles` belum ada. **Fix:** Jalankan seed SQL di Section 8.

### `supabase db push` error `missing FROM-clause entry for table "new"`
RLS `WITH CHECK` tidak bisa pakai `NEW.role`. **Fix:** Ganti dengan `role` langsung (tanpa prefix).

---

## 10. Catatan Penting untuk Sesi Berikutnya

- **Edge Functions** perlu di-deploy ke Supabase sebelum tab AI Prediksi dan Cek IMEI bisa digunakan:
  ```bash
  supabase functions deploy predict-price --no-verify-jwt
  supabase functions deploy lookup-imei --no-verify-jwt
  ```
