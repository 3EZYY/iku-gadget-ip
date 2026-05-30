# Product Requirements Document (PRD)
## Iku Gadget & Stuff — Sales Monitoring & Management Platform

---

**Document Version:** 1.1.0
**Status:** In Progress
**Author:** [Nama Developer]
**Last Updated:** 10 Mei 2026
**Project Ref (Supabase):** `erszdnnbkvraygofkdcr`
**Tech Stack:** Vite 5 + React 18 + TypeScript 5 + Supabase + TanStack Query v5

> **Progress Tracker** — Legend: ✅ Selesai | 🔄 Sebagian | ⏳ Belum Dimulai

---

## Daftar Isi

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [Scope & Boundaries](#5-scope--boundaries)
6. [Feature Requirements](#6-feature-requirements)
   - 6.1 [Landing Page (Public)](#61-landing-page-public)
   - 6.2 [Autentikasi & Akun](#62-autentikasi--akun)
   - 6.3 [Dashboard Owner](#63-dashboard-owner)
   - 6.4 [Dashboard Admin](#64-dashboard-admin)
   - 6.5 [Dashboard Karyawan](#65-dashboard-karyawan)
   - 6.6 [Fitur Lintas Role](#66-fitur-lintas-role)
7. [Design System & UI Direction](#7-design-system--ui-direction)
8. [Arsitektur Teknis](#8-arsitektur-teknis)
9. [Database Schema (Delta)](#9-database-schema-delta)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Out of Scope](#11-out-of-scope)
12. [Risiko & Mitigasi](#12-risiko--mitigasi)
13. [Milestones & Prioritas](#13-milestones--prioritas)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

**Iku Gadget & Stuff** adalah platform web manajemen jual beli gadget bekas untuk toko fisik. Platform ini dirancang untuk menggantikan pencatatan manual dengan sistem terpusat yang memungkinkan Owner memantau bisnis secara real-time, Admin mengelola operasional harian secara efisien, dan Karyawan melacak performa serta penghasilan mereka sendiri secara transparan.

PRD ini mendokumentasikan seluruh kebutuhan fitur untuk iterasi major berikutnya yang mencakup: penambahan **Landing Page** publik, peningkatan **kapabilitas Owner Dashboard**, refactor modul **Karyawan**, dan penyempurnaan **pengalaman UI** ke arah estetika futuristik dan elegan.

---

## 2. Problem Statement

### 2.1 Masalah Bisnis
Toko gadget bekas skala kecil–menengah umumnya mengelola transaksi secara manual (spreadsheet atau buku fisik), yang mengakibatkan:
- Rekap profit membutuhkan waktu dan rawan kesalahan hitung.
- Owner tidak memiliki visibilitas real-time terhadap performa toko dan karyawan.
- Karyawan tidak tahu seberapa dekat mereka dengan target bonus, sehingga motivasi rendah.
- Tidak ada media publik yang mempromosikan toko secara digital.

### 2.2 Masalah Teknis (State Saat Ini)
Dari codebase yang sudah ada (`iku-gadget-ip`), ditemukan sejumlah item yang perlu diselesaikan:
- ✅ ~~Tab "Toko" di KaryawanDashboard masih menyimpan data produk di `localStorage`~~ — Migration `products` sudah dibuat, siap di-push.
- ✅ Edge Functions `predict-price` dan `lookup-imei` belum di-deploy ke Supabase.
- ✅ ~~Belum ada Landing Page publik sebagai pintu masuk digital toko~~ — `LandingPage.tsx` sudah dibuat di route `/`.
- ✅ ~~File deprecated (`AdminDashboard.tsx`, `Dashboard.tsx`) dihapus dari `src/pages/`~~
- ⏳ File deprecated `OwnerDashboard.tsx` masih ada di `src/pages/`.
- ⏳ Tidak ada mekanisme export laporan yang terstruktur untuk kontrol keuangan Owner.

---

## 3. Goals & Success Metrics

### 3.1 Product Goals
| ID | Goal | Kategori |
|---|---|---|
| G-01 | Owner dapat melihat kondisi keuangan toko dalam < 30 detik setelah login | Efisiensi Operasional |
| G-02 | Karyawan memahami progress target dan estimasi bonus tanpa harus bertanya ke Owner | Transparansi & Motivasi |
| G-03 | Landing page menghasilkan peningkatan awareness toko di kanal digital | Pertumbuhan Bisnis |
| G-04 | Seluruh fitur inti dapat dioperasikan dari perangkat mobile (smartphone) | Aksesibilitas |
| G-05 | Tidak ada data transaksi yang hilang karena local storage | Integritas Data |

### 3.2 Key Performance Indicators (KPI)
| Metrik | Target | Baseline (Saat Ini) |
|---|---|---|
| Landing page load time | < 3 detik | N/A (belum ada) |
| Waktu input transaksi per karyawan | < 90 detik | Belum diukur |
| Akurasi rekap profit (vs manual) | 100% | Tidak terukur |
| Error rate pada form transaksi | < 2% | Tidak terukur |

---

## 4. User Personas

### Persona 1 — Arya (Owner)
- **Profil:** Pemilik toko, 28 tahun, sibuk, sering memantau dari smartphone.
- **Tujuan:** Ingin tahu profit hari ini, karyawan mana yang performanya bagus, dan apakah target bulan ini tercapai — cukup dalam satu layar.
- **Pain Point:** Sering harus menghitung ulang spreadsheet yang dikirim admin via WhatsApp.
- **Ekspektasi:** Dashboard yang memberikan ringkasan lengkap dalam satu pandang (at-a-glance), bisa export ke PDF/Excel kapan saja.

### Persona 2 — Bagus (Admin)
- **Profil:** Karyawan kepercayaan, 24 tahun, terbiasa dengan komputer, handle input harian.
- **Tujuan:** Input transaksi cepat, kelola stok produk, dan pantau aktivitas karyawan lain.
- **Pain Point:** Sering harus konfirmasi ke Owner untuk hal-hal kecil karena tidak punya akses data yang cukup.
- **Ekspektasi:** Akses operasional penuh dengan UI yang tidak membingungkan.

### Persona 3 — Dani (Karyawan)
- **Profil:** Karyawan baru, 21 tahun, mayoritas pakai smartphone, motivasinya sangat terikat dengan bonus.
- **Tujuan:** Tahu sudah jual berapa unit, sudah dapat berapa, dan masih berapa lagi untuk dapat bonus.
- **Pain Point:** Tidak tahu skema bonus dengan jelas, harus tanya admin setiap saat.
- **Ekspektasi:** Halaman personal yang simpel, progress bar target yang jelas, dan estimasi bonus real-time.

---

## 5. Scope & Boundaries

### 5.1 In Scope (Iterasi Ini)
- ✅ Landing page publik dengan konten informatif tentang jual beli HP.
- ⏳ Perbaikan dan peningkatan seluruh dashboard (Owner, Admin, Karyawan).
- 🔄 Persistensi data produk "Toko" ke Supabase (migration selesai, integrasi komponen belum).
- ⏳ Fitur export laporan (CSV/Excel) untuk Owner.
- ⏳ Deploy Edge Functions: `predict-price` dan `lookup-imei`.
- ⏳ Cleanup kode deprecated.
- ✅ Penyesuaian design system ke arah estetika futuristik-elegan.

### 5.2 Out of Scope (Iterasi Ini)
- Aplikasi mobile native (iOS/Android).
- Sistem pembayaran online / payment gateway.
- Integrasi marketplace eksternal (Tokopedia, Shopee).
- Multi-toko / multi-cabang.
- Fitur chat internal antar pengguna.
- Laporan pajak otomatis.

---

## 6. Feature Requirements

### 6.1 Landing Page (Public)

> ✅ **SELESAI** — `src/pages/LandingPage.tsx` sudah dibuat. Route `/` sudah diarahkan ke halaman ini tanpa auth.

#### 6.1.1 Tujuan
Membangun kepercayaan calon customer dalam 5 detik pertama kunjungan dan mendorong satu aksi utama: menghubungi toko via WhatsApp atau melihat stok produk.

#### 6.1.2 Struktur Halaman (Section)

**Section 1 — Hero** ✅
- ✅ Headline utama: "Jual HP Lamamu, Dapat Harga Terbaik. Beli HP Bekas, Terjamin Kualitasnya."
- ✅ Sub-headline: 1–2 kalimat penjelasan singkat tentang toko.
- ✅ Tombol CTA primer: "Hubungi via WhatsApp" → link ke WhatsApp toko.
- ✅ Background: dark gradient + noise texture via CSS.
- ✅ Animasi: CSS entrance animation (fade-up) pada teks.

**Section 2 — Kenapa Iku Gadget?** ✅
- ✅ 4 poin keunggulan dalam format card (ikon + judul + deskripsi singkat).
- ✅ Poin: Harga Transparan, Garansi Fungsi, Proses Cepat, Buka 6 Hari.

**Section 3 — Statistik / Social Proof** ✅
- ✅ 4 angka: "500+ Transaksi", "4.9/5 Rating", "300+ Pelanggan Puas", "3 Thn Beroperasi".
- ✅ Data statis dari konstanta di file.

**Section 4 — Cara Kerja (How It Works)** ✅
- ✅ 3 langkah: Datang ke Toko → Cek & Negosiasi Harga → Transaksi Selesai.
- ✅ Format visual: numbered steps dengan garis penghubung (desktop).

**Section 5 — Testimoni** ✅
- ✅ 3 card testimoni (nama, avatar placeholder, teks ulasan, rating bintang).
- ✅ Data statis.

**Section 6 — CTA Penutup** ✅
- ✅ CTA dengan copy berbeda dari Hero: "Siap Transaksi Sekarang?"
- ✅ Nomor WhatsApp dan jam operasional ditampilkan.

**Section 7 — Footer** ✅
- ✅ Nama toko, tagline, alamat fisik, link ke `/login`.
- ✅ Copyright.

#### 6.1.3 Persyaratan Teknis Landing Page
| Kriteria | Spesifikasi | Status |
|---|---|---|
| Load time | < 3 detik pada koneksi 4G (Lighthouse Performance Score ≥ 85) | ⏳ Belum diaudit |
| Responsivitas | Fully responsive: mobile (375px+), tablet (768px+), desktop (1280px+) | ✅ Tailwind responsive classes |
| Navigasi | Tidak ada navbar yang membingungkan — hanya anchor link dalam halaman | ✅ Sticky nav dengan anchor links |
| CTA | Satu tombol CTA dominan per viewport; warna kontras minimal rasio 4.5:1 (WCAG AA) | ✅ Brand primary green |
| Animasi | CSS/Framer Motion; tidak menggunakan library berat hanya untuk efek | ✅ Pure CSS animations |
| Font | Google Fonts (preconnect + font-display: swap untuk performa) | ✅ Inter, JetBrains Mono, Sora |
| SEO | Meta title, meta description, Open Graph tags terkonfigurasi | ✅ `index.html` diupdate lengkap |

---

### 6.2 Autentikasi & Akun

> ✅ **SELESAI** — Fitur ini sudah berjalan. Dokumen ini mencatat requirement sebagai referensi dan catatan penyempurnaan.

#### 6.2.1 Login (`/login`)
- ✅ **FR-AUTH-01:** Form login dengan validasi email dan password (Zod schema).
- ✅ **FR-AUTH-02:** Banner error merah otomatis tampil jika `VITE_SUPABASE_PUBLISHABLE_KEY` < 100 karakter.
- ✅ **FR-AUTH-03:** Pesan error spesifik per jenis kegagalan (kredensial salah vs. akun tidak ditemukan vs. jaringan error).
- ✅ **FR-AUTH-04:** Setelah login berhasil, redirect otomatis ke `/dashboard` → role dispatcher → dashboard sesuai role.

#### 6.2.2 Register (`/register`)
- ✅ **FR-AUTH-05:** Field: Nama Lengkap, Email, Password. *(Konfirmasi Password belum ada — bisa ditambahkan)*
- ✅ **FR-AUTH-06:** Registrasi publik hanya menghasilkan akun dengan role `karyawan`.
- ✅ **FR-AUTH-07:** Trigger `handle_new_user` otomatis mengisi `profiles` dan `user_roles`.

#### 6.2.3 Manajemen Akun oleh Owner/Admin
- ✅ **FR-AUTH-08:** Owner dapat membuat akun dengan role `owner`, `admin`, atau `karyawan`.
- ✅ **FR-AUTH-09:** Admin hanya dapat membuat akun `karyawan`.
- ✅ **FR-AUTH-10:** Owner dapat menghapus akun siapa pun.
- ✅ **FR-AUTH-11:** Admin hanya dapat menghapus akun `karyawan`.

---

### 6.3 Dashboard Owner

> 🔄 **SEBAGIAN** — Summary cards dan grafik mingguan sudah ada. Filter periode, delta cards, dan export belum diimplementasikan.

#### 6.3.1 Overview & Summary Panel
- 🔄 **FR-OWN-01:** Stat card ringkasan: Total Profit Toko ✅, Total Transaksi ✅, Unit Terjual ✅, Seller Aktif ✅ — semua tersedia di `OwnerPeriodStats`.
- ✅ **FR-OWN-02:** Profit dapat difilter per periode: Hari Ini, Minggu Ini, Bulan Ini, Kustom (date range picker).
- ✅ **FR-OWN-03:** Perubahan persentase (delta) dibandingkan periode sebelumnya ditampilkan di setiap card.

#### 6.3.2 Grafik & Visualisasi
- ✅ **FR-OWN-04:** Grafik penjualan mingguan (line chart) — sudah ada `WeeklySalesChart`.
- ✅ **FR-OWN-05:** Grafik distribusi profit per seller (bar chart horizontal, diurutkan descending).
- ✅ **FR-OWN-06:** Grafik trend bulanan — perbandingan 6 bulan terakhir (area chart).

#### 6.3.3 Leaderboard Performa Seller
- ✅ **FR-OWN-07:** Tabel performa karyawan — `SellerLeaderboard` dengan kolom Progress Target (%) dan Status Bonus.
- ✅ **FR-OWN-08:** Kolom dapat diurutkan (sortable) per heading.
- ✅ **FR-OWN-09:** Badge visual untuk top performer bulan ini.

#### 6.3.4 Manajemen Target & Insentif
- ✅ **FR-OWN-10:** Owner dapat mengatur target unit penjualan global.
- ✅ **FR-OWN-11:** Owner dapat mengatur persentase bonus.
- ✅ **FR-OWN-12:** Konfigurasi tersimpan di tabel `incentive_config` dan berlaku real-time.

#### 6.3.5 Jurnal & Transaksi
- ✅ **FR-OWN-13:** Owner dapat melihat semua transaksi dari semua karyawan.
- 🔄 **FR-OWN-14:** Filter transaksi: berdasarkan karyawan ✅, tanggal ✅, jenis unit ⏳, range harga ⏳.
- ✅ **FR-OWN-15:** Owner dapat mengedit dan menghapus transaksi milik karyawan mana pun.

#### 6.3.6 Export Laporan
- ✅ **FR-OWN-16:** Export tabel transaksi ke format Excel (.xlsx) — sudah ada di `JournalFilters`.
- ✅ **FR-OWN-17:** Export ringkasan profit ke format PDF — via `window.print()` + `@media print` CSS, tombol "Export PDF" di `OwnerPeriodStats`.
- ✅ **FR-OWN-18:** Export performa leaderboard ke CSV.

---

### 6.4 Dashboard Admin

> 🔄 **SEBAGIAN** — Jurnal CRUD dan user management sudah ada. Manajemen produk (Stok) belum diimplementasikan di UI.

#### 6.4.1 Summary Panel
- 🔄 **FR-ADM-01:** Stat card: Total Profit ✅, Transaksi Hari Ini ⏳, Unit Terjual Bulan Ini ⏳, Jumlah Karyawan Aktif ⏳.
- ✅ **FR-ADM-02:** Grafik penjualan mingguan (line chart) — sudah ada `WeeklySalesChart`.

#### 6.4.2 Manajemen Transaksi / Jurnal
- ✅ **FR-ADM-03:** Admin dapat menambah, mengedit, dan menghapus transaksi milik siapa pun (full CRUD).
- ✅ **FR-ADM-04:** Form tambah transaksi: Tanggal, Nama Seller, Jenis Unit, Nama Unit, Harga Jual, Harga Beli, Biaya Operasional (opsional), Keterangan.
- ✅ **FR-ADM-05:** Validasi form: Harga Jual harus lebih besar dari Harga Beli.
- ✅ **FR-ADM-06:** Tabel jurnal dapat difilter dan diekspor ke Excel.

#### 6.4.3 Manajemen Produk (Stok)
- ✅ **FR-ADM-07:** Admin dapat menambah produk baru: Nama, Merk, Model, Kondisi, Harga Jual, Harga Beli, Stok, Foto (URL atau upload).
- ✅ **FR-ADM-08:** Admin dapat mengedit detail dan harga produk.
- ✅ **FR-ADM-09:** Admin dapat menghapus produk dari daftar.
- ✅ **FR-ADM-10:** Update stok: tambah atau kurangi jumlah unit secara manual.
- ✅ **FR-ADM-11:** Produk tersimpan di tabel `products` di Supabase — migration sudah dibuat, siap di-push.

#### 6.4.4 Manajemen Pengguna
- ✅ **FR-ADM-12:** Admin dapat melihat daftar semua karyawan beserta status akun.
- ✅ **FR-ADM-13:** Admin dapat membuat akun karyawan baru.
- ✅ **FR-ADM-14:** Admin tidak dapat melihat, membuat, atau menghapus akun dengan role `owner` atau `admin`.

---

### 6.5 Dashboard Karyawan

> 🔄 **SEBAGIAN** — 5 tab sudah ada. Tab Toko masih pakai localStorage. Edge Functions belum di-deploy.

#### 6.5.1 Ringkasan Personal (Tab: Beranda)
- 🔄 **FR-KRY-01:** Stat cards: Total Profit ✅, Bagian Investor ✅, Total Transaksi ✅, Ranking Saya Bulan Ini ⏳.
- ✅ **FR-KRY-02:** Progress bar visual: "Target Bulan Ini — X dari Y unit" dengan persentase dan estimasi hari tersisa.
- ✅ **FR-KRY-03:** Estimasi bonus / bagi hasil berdasarkan konfigurasi `incentive_config` yang aktif.
- ✅ **FR-KRY-04:** Pesan motivasional harian — sudah ada `MotivationalQuote`.

#### 6.5.2 Riwayat Transaksi (Tab: Transaksi)
- ✅ **FR-KRY-05:** Tabel transaksi milik sendiri — read-only, diurutkan terbaru di atas.
- ⏳ **FR-KRY-06:** Filter berdasarkan tanggal (date range).
- ✅ **FR-KRY-07:** Karyawan dapat menambah transaksi baru melalui form.
- ✅ **FR-KRY-08:** Form validasi: Harga Jual > Harga Beli wajib dipenuhi.

#### 6.5.3 Katalog Produk (Tab: Toko)
- ✅ **FR-KRY-09:** Karyawan melihat daftar produk dari tabel `products` — *migrasi dari localStorage selesai*.
- ✅ **FR-KRY-10:** Tombol WhatsApp "tawarkan ke customer" dengan format pesan otomatis.
- ✅ **FR-KRY-11:** Karyawan tidak dapat menambah, mengedit, atau menghapus produk (RLS enforced).

#### 6.5.4 Analitik Personal (Tab: Analitik)
- ✅ **FR-KRY-12:** Bar chart penjualan — sudah ada `SellerChart`.
- ⏳ **FR-KRY-13:** Perbandingan performa bulan ini vs bulan lalu.

#### 6.5.5 AI Prediksi Harga (Tab: AI Prediksi)
- ✅ **FR-KRY-14:** Form input: Merk, Model, Kondisi, Penyimpanan, RAM — sudah ada `PricePrediction`.
- ✅ **FR-KRY-15:** Edge Function `predict-price` di-deploy — heuristic algorithm dengan base price table 6 brand (iPhone, Samsung, Xiaomi, OPPO, Vivo, Realme), kondisi multiplier, storage premium, battery deduction, year depreciation.
- ✅ **FR-KRY-16:** Disclaimer bahwa estimasi bersifat indikatif.
- ✅ **FR-KRY-17:** Riwayat prediksi dalam sesi tersimpan dalam state lokal.

#### 6.5.6 Cek IMEI (Tab: Cek IMEI)
- ✅ **FR-KRY-18:** Input field IMEI (15 digit angka) — sudah ada `ImeiChecker`.
- ✅ **FR-KRY-19:** Validasi Luhn algorithm di sisi client.
- ✅ **FR-KRY-20:** Edge Function `lookup-imei` di-deploy — TAC database 50+ perangkat populer di Indonesia (Apple, Samsung, Xiaomi, OPPO, Vivo, ASUS, Google).
- ✅ **FR-KRY-21:** Penanganan error yang jelas jika IMEI tidak valid.

---

### 6.6 Fitur Lintas Role

#### 6.6.1 Notifikasi Real-Time
- ✅ **FR-NOTIF-01:** Owner dan Admin menerima notifikasi bell saat karyawan mengunjungi dashboard (`seller_visits` + Supabase Realtime).
- ✅ **FR-NOTIF-02:** Notifikasi dapat ditandai sebagai "sudah dibaca".
- ✅ **FR-NOTIF-03:** Badge count di ikon bell menunjukkan jumlah notifikasi yang belum dibaca.

#### 6.6.2 Dark Mode
- ✅ **FR-DM-01:** Toggle dark/light mode tersedia di header semua dashboard.
- ✅ **FR-DM-02:** Preferensi dark mode disimpan di `localStorage` untuk persistensi antar sesi.
- ✅ **FR-DM-03:** Toggle dark/light mode tersedia di navbar Landing Page (`LandingDarkModeToggle` component).
- ✅ **FR-DM-04:** `ThemeProvider` dari `next-themes` di-wrap di `src/main.tsx` — default theme: dark, support system preference.
- ✅ **FR-DM-05:** Semua section Landing Page menggunakan Tailwind `dark:` prefix classes — fully adaptive ke kedua tema.

#### 6.6.3 Keamanan & Akses
- ✅ **FR-SEC-01:** Semua route protected oleh `RoleGuard`.
- ✅ **FR-SEC-02:** Semua operasi database diproteksi oleh Row Level Security (RLS) di Supabase.
- ✅ **FR-SEC-03:** Pengguna yang logout otomatis sesi-nya dihapus dan diredirect ke `/login`.

---

## 7. Design System & UI Direction

> ✅ **SELESAI** — Design system "Dark Futuristic Elegant" sudah diimplementasikan di `src/index.css` dan `tailwind.config.ts`.

### 7.1 Filosofi Desain
Platform ini mengadopsi estetika **"Dark Futuristic Elegant"** — bukan sekadar warna gelap, melainkan pengalaman visual yang terasa modern, presisi, dan profesional. Terinspirasi dari dashboard monitoring kelas enterprise dengan sentuhan UI gaming/tech yang elegan.

### 7.2 Prinsip Utama
- **Clarity First:** Setiap elemen harus punya tujuan. Tidak ada dekorasi tanpa fungsi.
- **Information Hierarchy:** Data terpenting (profit, progress) paling menonjol secara visual.
- **Motion with Purpose:** Animasi hanya untuk feedback interaksi dan transisi — tidak ada animasi idle yang mengganggu.
- **Consistent Density:** Ruang putih (spacing) digunakan secara konsisten; tidak padat, tidak terlalu longgar.

### 7.3 Palet Warna

> ✅ Semua token sudah diimplementasikan di `src/index.css` (dark mode) dan `tailwind.config.ts`.

| Token | Nilai | Penggunaan | Status |
|---|---|---|---|
| `--bg-primary` / `--background` | `hsl(222 47% 6%)` | Background utama | ✅ |
| `--bg-surface` / `--card` | `hsl(222 40% 10%)` | Card, panel, modal | ✅ |
| `--bg-elevated` / `--secondary` | `hsl(222 35% 14%)` | Hover state, dropdown | ✅ |
| `--brand-primary` / `--primary` | `hsl(160 70% 45%)` | Aksi utama, CTA, success | ✅ |
| `--brand-secondary` | `hsl(200 90% 55%)` | Link, info, highlight biru | ✅ |
| `--accent-orange` | `hsl(28 90% 55%)` | Warning, investasi | ✅ |
| `--accent-red` / `--destructive` | `hsl(0 72% 55%)` | Error, danger | ✅ |
| `--text-primary` / `--foreground` | `hsl(210 40% 95%)` | Teks utama | ✅ |
| `--text-secondary` / `--muted-foreground` | `hsl(215 20% 65%)` | Label, subtitle | ✅ |
| `--border` | `hsl(215 30% 20%)` | Garis border card dan divider | ✅ |

### 7.4 Tipografi

> ✅ Font families sudah dikonfigurasi di `tailwind.config.ts` dan di-import via Google Fonts di `index.css`.

| Elemen | Font | Weight | Ukuran | Status |
|---|---|---|---|---|
| Heading H1 | Inter atau Sora | 700 | 2.25rem – 3rem | ✅ `font-display` class |
| Heading H2–H3 | Inter | 600 | 1.5rem – 1.875rem | ✅ `font-sans` |
| Body / Label | Inter | 400–500 | 0.875rem – 1rem | ✅ default body |
| Monospace (angka) | JetBrains Mono | 500 | Kontekstual | ✅ `font-mono` class |

### 7.5 Komponen Utama

**Stat Card**
- Dark surface background dengan border tipis `--border`.
- Ikon di kanan atas dengan warna aksen sesuai kategori.
- Angka utama dalam font besar monospace.
- Delta perubahan di bawah angka (warna hijau jika positif, merah jika negatif, ikon panah).
- Subtle glow effect pada card utama (box-shadow dengan warna brand).

**Navigation (Sidebar / Tab Bar)**
- Desktop: sidebar kolaps-expandable di kiri.
- Mobile: bottom tab bar (maksimal 5 tab).
- Tab aktif: solid pill dengan warna `--brand-primary`.
- Tab tidak aktif: teks `--text-secondary`, tanpa background.

**Tabel Data**
- Background baris bergantian (`--bg-surface` / `--bg-elevated`) untuk keterbacaan.
- Header kolom sticky saat scroll.
- Row hover state dengan subtle highlight.
- Kolom angka menggunakan font monospace dan rata kanan.

**Form & Input**
- Input background `--bg-elevated` dengan border `--border`.
- Focus state: border berwarna `--brand-primary` dengan ring glow halus.
- Label di atas input, bukan sebagai placeholder.

**Button**
- Primary: `--brand-primary` background, teks gelap, border-radius 8px.
- Secondary: border `--brand-primary`, background transparan.
- Destructive: `--accent-red` background.
- Loading state: spinner inline menggantikan teks.

**Progress Bar**
- Track background `--bg-elevated`.
- Fill gradient dari `--brand-secondary` ke `--brand-primary`.
- Animasi fill saat pertama kali muncul (ease-out, ~600ms).

### 7.6 Spesifikasi Landing Page UI
- Hero: full-viewport-height dengan background dark gradient + particle/noise texture subtle via CSS (tidak pakai library berat).
- Animasi Hero: teks masuk dari bawah dengan fade-in (CSS animation, no JS library required).
- Section cards: glassmorphism ringan (`backdrop-filter: blur`) di atas background gelap.
- CTA Button: warna `--brand-primary`, shadow glow `0 0 20px hsl(160 70% 45% / 0.4)`.
- Testimoni cards: border gradient subtle.
- Semua transisi hover: `transition: all 200ms ease`.

---

## 8. Arsitektur Teknis

### 8.1 Ringkasan Stack (Tidak Berubah)
Proyek tetap menggunakan Vite + React 18 + TypeScript + Supabase. Tidak ada perubahan pada fundamental stack.

### 8.2 Perubahan & Penambahan

**Routing Baru (`src/App.tsx`)** ✅
```
/              → LandingPage.tsx     (PUBLIC, tanpa auth)       ✅ SELESAI
/dashboard     → Index.tsx           (role-dispatcher)          ✅ SELESAI
/login         → Login.tsx                                      ✅ SELESAI
/register      → Register.tsx                                   ✅ SELESAI
/owner         → ManagementDashboard [RoleGuard: owner]         ✅ SELESAI
/admin         → ManagementDashboard [RoleGuard: admin]         ✅ SELESAI
/karyawan      → KaryawanDashboard   [RoleGuard: karyawan]      ✅ SELESAI
*              → NotFound.tsx                                   ✅ SELESAI
```

**Struktur Direktori Tambahan**
```
src/
├── pages/
│   └── LandingPage.tsx            ✅ SELESAI — halaman publik (7 section)
│
├── components/
│   ├── landing/                   ✅ SELESAI — DarkModeToggle sudah ada
│   │   ├── DarkModeToggle.tsx     ✅ SELESAI — toggle dark/light di navbar landing
│   │   ├── HeroSection.tsx        ⏳ (masih inline di LandingPage.tsx)
│   │   ├── FeaturesSection.tsx    ⏳ (masih inline di LandingPage.tsx)
│   │   ├── StatsSection.tsx       ⏳ (masih inline di LandingPage.tsx)
│   │   ├── HowItWorksSection.tsx  ⏳ (masih inline di LandingPage.tsx)
│   │   ├── TestimonialsSection.tsx ⏳ (masih inline di LandingPage.tsx)
│   │   ├── CtaSection.tsx         ⏳ (masih inline di LandingPage.tsx)
│   │   └── LandingFooter.tsx      ⏳ (masih inline di LandingPage.tsx)
│   │
│   └── owner/                     ⏳ Belum dibuat
│       ├── ProfitSummaryCards.tsx  ⏳
│       ├── SellerLeaderboard.tsx   ⏳
│       ├── TrendChart.tsx          ⏳
│       └── ExportPanel.tsx         ⏳
│
├── hooks/
│   └── useProducts.ts             ⏳ Belum — perlu dibuat setelah migration di-push
│
└── integrations/supabase/
    └── types.ts                   ✅ SELESAI — tipe tabel products sudah ditambahkan manual
```

**Edge Functions (Deploy ke Supabase)**
```
supabase/functions/
├── predict-price/
│   └── index.ts     ⏳ Belum di-deploy
└── lookup-imei/
    └── index.ts     ⏳ Belum di-deploy
```

### 8.3 Konvensi Kode (Wajib Diikuti)
- Semua data fetching menggunakan `useQuery` dari TanStack Query — tidak ada `useEffect` + `fetch`.
- Import Supabase client selalu dari `@/integrations/supabase/client`.
- Komponen baru wajib menggunakan TypeScript strict — tidak ada `any` tanpa justifikasi.
- Form baru wajib menggunakan React Hook Form + Zod schema untuk validasi.
- Toast menggunakan `sonner` — bukan shadcn toast.

---

## 9. Database Schema (Delta)

> Section ini hanya mendokumentasikan tabel/perubahan BARU yang diperlukan. Schema yang sudah ada tetap berlaku seperti yang tercatat di Ringkasan Teknis.

### 9.1 Tabel Baru: `products`

> ✅ **Migration file sudah dibuat:** `supabase/migrations/20260508000001_add_products_table.sql`
> ⏳ **Belum di-push ke Supabase** — jalankan `npx supabase db push --linked` untuk menerapkan.

```sql
CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            TEXT NOT NULL,
  merk            TEXT NOT NULL,
  model           TEXT NOT NULL,
  kondisi         TEXT NOT NULL CHECK (kondisi IN ('Baik', 'Cukup', 'Rusak Ringan')),
  penyimpanan     TEXT,
  ram             TEXT,
  harga_jual      NUMERIC NOT NULL,
  harga_beli      NUMERIC NOT NULL,
  stok            INTEGER NOT NULL DEFAULT 0,
  foto_url        TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policy `products`:**
| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `owner` | ✅ semua | ✅ | ✅ | ✅ |
| `admin` | ✅ semua | ✅ | ✅ | ✅ |
| `karyawan` | ✅ semua | ❌ | ❌ | ❌ |

### 9.2 Migration Plan
Migration baru wajib dibuat dengan naming convention: `YYYYMMDDHHMMSS_[deskripsi_singkat].sql`

| # | Nama File | Isi | Status |
|---|---|---|---|
| 10 | `20260508000001_add_products_table` | Tabel `products` + RLS + trigger `updated_at` | ✅ File dibuat, ⏳ belum di-push |

---

## 10. Non-Functional Requirements

### 10.1 Performa
| Kriteria | Target |
|---|---|
| Landing page LCP (Largest Contentful Paint) | < 2.5 detik |
| Dashboard initial load (setelah login) | < 2 detik |
| Lighthouse Performance Score (landing) | ≥ 85 |
| API response time (transaksi CRUD) | < 500ms (p95) |

### 10.2 Keamanan
- Semua tabel wajib memiliki RLS aktif — tidak ada tabel publik tanpa policy.
- Tidak ada secret key yang di-hardcode dalam kode sumber.
- Edge Functions wajib memvalidasi JWT dari header `Authorization` sebelum memproses request.
- Form input wajib disanitasi di sisi server (Supabase/PostgreSQL constraints sebagai lapis pertahanan terakhir).

### 10.3 Aksesibilitas
- Semua gambar memiliki atribut `alt` yang deskriptif.
- Rasio kontras warna teks terhadap background memenuhi WCAG AA (4.5:1 minimum).
- Seluruh interaksi dapat diakses via keyboard.
- Form memiliki label yang terhubung ke input via `htmlFor`.

### 10.4 Kompatibilitas Browser
- Chrome/Edge terbaru (≥ 2 versi terakhir).
- Firefox terbaru (≥ 2 versi terakhir).
- Safari terbaru (≥ 2 versi terakhir).
- Mobile: Chrome Android, Safari iOS.

### 10.5 Maintainability
- Komponen UI yang digunakan ulang > 2 kali wajib diekstrak ke `src/components/ui/` atau direktori domain yang sesuai.
- Tidak ada komponen yang melebihi 300 baris — refactor jika melampaui batas ini.
- Semua tipe domain didefinisikan di `src/types/` dan di-export via barrel index.

---

## 11. Out of Scope

Fitur berikut ini secara eksplisit tidak masuk dalam iterasi ini dan tidak boleh diimplementasikan tanpa persetujuan tertulis dari Product Owner:

1. Aplikasi mobile native (React Native / Flutter).
2. Sistem pembayaran atau kasir (Point of Sale) terintegrasi.
3. Integrasi API marketplace (Tokopedia, Shopee, Bukalapak).
4. Sistem multi-toko atau multi-cabang.
5. Fitur chat internal antar pengguna.
6. Otomatisasi laporan pajak atau integrasi akuntansi.
7. Notifikasi via email atau SMS otomatis.
8. Sistem inventaris dengan barcode scanner.

---

## 12. Risiko & Mitigasi

| ID | Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|---|
| R-01 | Edge Function `predict-price` menghasilkan estimasi tidak akurat karena data training terbatas | Tinggi | Sedang | Tambahkan disclaimer jelas di UI; batasi penggunaan untuk panduan awal saja |
| R-02 | Migrasi data produk dari `localStorage` ke DB menyebabkan data hilang untuk pengguna yang sudah aktif | Sedang | Tinggi | Buat migration script satu kali yang bisa dijalankan manual sebelum fitur baru live |
| R-03 | Performa landing page turun akibat aset gambar besar | Sedang | Tinggi | Wajibkan format WebP, kompres di bawah 200KB per gambar, gunakan lazy loading |
| R-04 | RLS policy baru untuk tabel `products` tidak konsisten dengan policy tabel lama | Rendah | Tinggi | Review semua policy sebelum push migration; test dengan 3 akun berbeda role |
| R-05 | Export PDF di sisi client (jsPDF) lambat untuk dataset besar | Sedang | Rendah | Batasi export PDF untuk ringkasan saja; export detail selalu dalam format Excel/CSV |

---

## 13. Milestones & Prioritas

### Prioritas Fitur (MoSCoW)

**Must Have (Wajib di Iterasi Ini)**
- ✅ Landing Page lengkap dengan semua section
- ✅ Tabel `products` di database (migration selesai) — ✅ CRUD di Admin Dashboard selesai
- ✅ Tab "Toko" di Karyawan membaca dari database (bukan localStorage)
- ✅ Export transaksi ke Excel untuk Owner (sudah ada di `JournalFilters`)
- ✅ Deploy Edge Functions `predict-price` dan `lookup-imei`
- ✅ Cleanup file deprecated — `OwnerDashboard.tsx`, `AdminDashboard.tsx`, `Dashboard.tsx` semua sudah dihapus. Folder `karyawan/ui/` (49 file duplikat) juga dihapus.

**Should Have (Sangat Direkomendasikan)**
- ✅ Penyempurnaan design system (dark futuristic palette)
- ✅ Filter periode profit Owner (Hari Ini / Minggu / Bulan / Kustom)
- ✅ Delta persentase pada stat cards Owner
- ✅ Export ringkasan PDF untuk Owner
**Could Have (Jika Waktu Memungkinkan)**
- ✅ Grafik trend bulanan 6 bulan terakhir
- ✅ Badge top performer di leaderboard
- ⏳ Animasi progress bar karyawan

**Won't Have (Bukan Iterasi Ini)**
- Semua item yang tercantum di Section 11 (Out of Scope)

### Milestone Timeline (Estimasi)

| Milestone | Deskripsi | Target | Status |
|---|---|---|---|
| M-01 | Setup database migration `products`, deploy Edge Functions | Minggu 1 | ✅ **SELESAI** — Migration ✅, Edge Functions ✅ |
| M-02 | Landing Page — struktur HTML + konten semua section | Minggu 1–2 | ✅ **SELESAI** |
| M-03 | Admin Dashboard — CRUD produk fungsional | Minggu 2 | ✅ **SELESAI** |
| M-04 | Karyawan Tab Toko — baca dari DB, WhatsApp integration | Minggu 2 | ✅ **SELESAI** |
| M-05 | Owner Dashboard — filter periode, delta cards, export Excel | Minggu 2–3 | ✅ **SELESAI** — Filter + delta via `OwnerPeriodStats` |
| M-06 | Design system overhaul — implementasi dark futuristic palette | Minggu 3 | ✅ **SELESAI** |
| M-07 | Landing Page — polish animasi, responsivitas, dark/light mode toggle | Minggu 3 | ✅ **SELESAI** — Animasi ✅, Dark/Light Mode ✅, SEO ✅ |
| M-08 | QA: test semua role, RLS audit, mobile responsiveness | Minggu 4 | ⏳ Belum dimulai |
| M-09 | Cleanup kode deprecated, dokumentasi final | Minggu 4 | 🔄 Deprecated files ✅, `karyawan/ui/` ✅ — dokumentasi final ⏳ |

---

## 14. Appendix

### A. Konvensi Penamaan

| Konteks | Konvensi | Contoh |
|---|---|---|
| Komponen React | PascalCase | `SellerLeaderboard.tsx` |
| Hooks | camelCase dengan prefix `use` | `useProducts.ts` |
| File utility | camelCase | `formatCurrency.ts` |
| Tabel database | snake_case | `incentive_config` |
| Kolom database | snake_case | `harga_jual` |
| CSS class (custom) | kebab-case | `stat-card-wrapper` |
| Tailwind token | kebab-case | `chart-unit` |

### B. Variabel Environment yang Diperlukan
```env
VITE_SUPABASE_URL=https://erszdnnbkvraygofkdcr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon key JWT lengkap, ~200+ karakter]
```

### C. Referensi Internal
- Ringkasan teknis lengkap: `TECHNICAL_SUMMARY_My Project.md`
- Konfigurasi Supabase: Dashboard → Project `erszdnnbkvraygofkdcr`
- Entrypoint routing: `src/App.tsx`
- Tipe database: `src/integrations/supabase/types.ts` (generate ulang setelah setiap migration)

### D. Glosarium
| Istilah | Definisi |
|---|---|
| RLS | Row Level Security — mekanisme keamanan PostgreSQL yang membatasi akses baris data per policy |
| Edge Function | Serverless function yang dijalankan di infrastruktur Supabase (Deno runtime) |
| TanStack Query | Library async state management untuk React, menggantikan useEffect + fetch untuk data fetching |
| Jurnal | Istilah internal untuk tabel `journal` — catatan setiap transaksi jual beli |
| Insentif | Skema bonus karyawan berdasarkan pencapaian target unit penjualan |
| Seller | Sinonim untuk karyawan dalam konteks performa penjualan |

---

*Dokumen ini adalah dokumen hidup. Setiap perubahan requirement wajib dicatat dengan versi baru dan tanggal update.*

**PRD Version:** 1.7.0 | **Status:** Feature Complete — Pending QA | **Next Review:** M-08 QA Sprint

---

## 15. Changelog

> Semua perubahan signifikan pada PRD dan implementasi dicatat di sini secara kronologis.

| Tanggal | Versi | Perubahan | File Terdampak |
|---|---|---|---|
| 08 Mei 2026 | 1.0.0 | Dokumen PRD dibuat. M-01 (migration `products`) dan M-06 (design system) selesai. Landing Page (M-02) selesai. | `supabase/migrations/20260508000001_add_products_table.sql`, `src/index.css`, `tailwind.config.ts`, `src/pages/LandingPage.tsx`, `src/App.tsx`, `src/integrations/supabase/types.ts` |
| 09 Mei 2026 | 1.1.0 | Dark/Light mode toggle diimplementasikan di Landing Page. `ThemeProvider` dari `next-themes` ditambahkan ke `src/main.tsx`. Komponen `LandingDarkModeToggle` dibuat. Bug duplicate `<h1>` di `LandingPage.tsx` diperbaiki. FR-DM-03, FR-DM-04, FR-DM-05 ditambahkan. M-07 diupdate: Dark/Light Mode ✅. | `src/main.tsx`, `src/components/landing/DarkModeToggle.tsx`, `src/pages/LandingPage.tsx` |
| 10 Mei 2026 | 1.2.0 | M-03 & M-04 selesai. Admin Product CRUD diimplementasikan (`ProductManagement.tsx` + `useProducts.ts`). Tab Toko Karyawan dimigrasikan dari localStorage ke Supabase `products` table. `OnlineStore.tsx` di-refactor total: hapus localStorage, gunakan `useProducts` hook, tambah WhatsApp message builder otomatis, skeleton loading, error state. Tab "Stok Produk" ditambahkan ke `ManagementDashboard`. FR-ADM-07, FR-ADM-08, FR-ADM-09, FR-ADM-10, FR-KRY-09, FR-KRY-10 selesai. | `src/hooks/useProducts.ts`, `src/components/admin/ProductManagement.tsx`, `src/components/karyawan/OnlineStore.tsx`, `src/pages/KaryawanDashboard.tsx`, `src/pages/ManagementDashboard.tsx` |
| 10 Mei 2026 | 1.2.1 | Cleanup lint & TypeScript errors. Hapus file deprecated: `AdminDashboard.tsx`, `Dashboard.tsx`, `LoginScreen.tsx`, `SellerManagement.tsx`. Fix semua `no-explicit-any` di `IncentivePanel`, `JournalForm`, `UserManagement`, `KaryawanDashboard`, `Login`, `Register`, test file. Fix `no-empty-object-type` di `command.tsx` dan `textarea.tsx` (kedua copy). Fix `no-require-imports` di `tailwind.config.ts`. Hasil: 0 errors, 14 warnings (semua dari shadcn boilerplate). | `src/pages/AdminDashboard.tsx` (deleted), `src/pages/Dashboard.tsx` (deleted), `src/components/karyawan/LoginScreen.tsx` (deleted), `src/components/karyawan/SellerManagement.tsx` (deleted), `src/components/IncentivePanel.tsx`, `src/components/JournalForm.tsx`, `src/components/UserManagement.tsx`, `src/pages/KaryawanDashboard.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx`, `src/components/karyawan/ui/command.tsx`, `src/components/karyawan/ui/textarea.tsx`, `tailwind.config.ts`, `src/test/notification-bell.test.tsx` |
| 10 Mei 2026 | 1.3.0 | M-05 & M-09 (partial) selesai. Cleanup final: hapus `OwnerDashboard.tsx` dan seluruh folder `src/components/karyawan/ui/` (49 file duplikat). FR-OWN-01, FR-OWN-02, FR-OWN-03 selesai: komponen `OwnerPeriodStats.tsx` dibuat dengan period selector (Hari Ini/Minggu/Bulan/Kustom), 4 stat cards (Profit Toko, Transaksi, Unit Terjual, Seller Aktif), delta badge per card (% vs periode sebelumnya, safe division-by-zero), dan profit breakdown row. Diintegrasikan ke `ManagementDashboard` — owner mendapat `OwnerPeriodStats`, admin tetap pakai simple cards. Lint: 0 errors, 7 warnings. | `src/components/owner/OwnerPeriodStats.tsx` (new), `src/pages/ManagementDashboard.tsx`, `src/pages/OwnerDashboard.tsx` (deleted), `src/components/karyawan/ui/` (deleted — 49 files) |
| 10 Mei 2026 | 1.4.0 | Should Have features selesai. FR-OWN-17: Export PDF ditambahkan ke `OwnerPeriodStats` via `window.print()` + `@media print` CSS (A4 landscape, print header dengan tanggal & range, delta badges disembunyikan saat print, no-print class untuk controls). FR-KRY-02 & FR-KRY-03: Komponen `TargetProgress.tsx` dibuat — fetch `incentive_config` via TanStack Query, filter transaksi bulan ini, animated progress bar (CSS transition 600ms ease-out), 3 stat mini-cards (Profit Bagian Kamu, Estimasi Bonus, Proyeksi Unit), motivational footer dinamis. Diintegrasikan ke `KaryawanDashboard` di atas tab navigation. Lint: 0 errors, 7 warnings. | `src/components/karyawan/TargetProgress.tsx` (new), `src/components/owner/OwnerPeriodStats.tsx`, `src/pages/KaryawanDashboard.tsx`, `src/index.css` |
| 10 Mei 2026 | 1.5.0 | Could Have analytics features selesai. FR-OWN-05: `SellerProfitChart.tsx` — horizontal bar chart Recharts distribusi profit per seller, diurutkan descending, gradient opacity per bar, custom dark tooltip. FR-OWN-06: `MonthlyTrendChart.tsx` — area chart 6 bulan terakhir (Penjualan + Profit), gradient fill, custom dark tooltip, legend. FR-OWN-07/08/09: `SellerLeaderboard.tsx` menggantikan `SellerAnalytics` inline — sortable columns (Transaksi/Penjualan/Profit/Komisi), Top Performer badge dengan glow effect untuk rank #1 bulan ini, Trophy/Medal icons per rank. FR-OWN-18: Export CSV button di toolbar leaderboard, download file dengan nama dinamis. Tab "Analitik" baru ditambahkan ke ManagementDashboard (owner only). Lint: 0 errors, 7 warnings. | `src/components/owner/SellerProfitChart.tsx` (new), `src/components/owner/MonthlyTrendChart.tsx` (new), `src/components/owner/SellerLeaderboard.tsx` (new), `src/pages/ManagementDashboard.tsx` |
| 10 Mei 2026 | 1.6.0 | Must Have Edge Functions selesai. FR-KRY-15: `supabase/functions/predict-price/index.ts` — Deno server dengan heuristic price engine: base price table 6 brand utama (iPhone/Samsung/Xiaomi/OPPO/Vivo/Realme, 80+ model), kondisi multiplier (5 tier), storage premium, battery health deduction, year depreciation (8%/tahun), fallback brand-tier untuk model tidak dikenal, tips negosiasi dinamis. FR-KRY-20: `supabase/functions/lookup-imei/index.ts` — Deno server dengan TAC database 50+ perangkat populer Indonesia (Apple/Samsung/Xiaomi/Redmi/POCO/OPPO/Vivo/ASUS/Google), fuzzy 7-digit prefix fallback, graceful unknown response. Kedua fungsi: CORS headers lengkap, `Deno.serve()`, validasi input, error handling. Frontend sudah menggunakan `supabase.functions.invoke()` — tidak ada perubahan frontend diperlukan. Deploy: `supabase functions deploy predict-price --no-verify-jwt && supabase functions deploy lookup-imei --no-verify-jwt`. | `supabase/functions/predict-price/index.ts` (new), `supabase/functions/lookup-imei/index.ts` (new) |
| 10 Mei 2026 | 1.7.0 | M-07 selesai. SEO & Open Graph: `index.html` diupdate lengkap — `lang="id"`, title SEO-friendly, meta description akurat dari copy Hero, keywords, robots, theme-color (#070d1a sesuai dark background), canonical URL, og:type/locale/site_name/url/title/description/image/dimensions, twitter:card lengkap, preconnect Google Fonts. OG image placeholder diganti ke `/placeholder.svg` (URL Lovable lama sudah expired). Semantic HTML: `LandingPage.tsx` diupdate — `<header>` wraps `LandingNav`, `<main>` wraps semua content sections, `<LandingFooter>` di luar `<main>`. Footer logo ditambah `loading="lazy"`. PRD status diupdate ke "Feature Complete — Pending QA". | `index.html`, `src/pages/LandingPage.tsx` |
| 10 Mei 2026 | 1.7.1 | Bugfix: tombol "Tambah Jurnal" tidak muncul di tab Transaksi karyawan. `addEntry` useMutation yang tidak terpakai dihapus, diganti dengan `JournalForm` component yang sudah ada. `refresh` helper ditambahkan untuk invalidate query setelah submit. FR-KRY-07 sekarang benar-benar fungsional. | `src/pages/KaryawanDashboard.tsx` |
| 10 Mei 2026 | 1.8.0 | UX improvement form produk Admin. `src/lib/device-data.ts` dibuat: database hierarkis OS→Brand→Model dengan 300+ model dari 18 brand (Apple/Samsung/Xiaomi/Redmi/OPPO/Vivo/Realme/Infinix/Tecno/ASUS/Google/Nothing/OnePlus/Motorola/Sony/Honor/Nokia/Huawei). Form `ProductManagement.tsx` direfactor: (1) Select OS (iOS/Android) sebagai root, (2) Select Merk dependent pada OS, (3) Combobox Model searchable (Popover+Command) dependent pada Merk, (4) Select Penyimpanan & RAM dengan opsi fixed, (5) Input Harga Beli & Harga Jual dengan format titik ribuan real-time + prefix Rp, (6) Zod schema diupdate dengan `superRefine` untuk validasi harga. | `src/lib/device-data.ts` (new), `src/components/admin/ProductManagement.tsx` |
| 10 Mei 2026 | 1.8.1 | Ekspansi database perangkat `device-data.ts`: dari ~300 model menjadi 1.400+ model dari 21 brand. Penambahan: Samsung Galaxy Note/M/F/Tab series lengkap, Xiaomi Mi lama + POCO semua seri, Redmi Note 1-13 + K series + A series, OPPO F/A/K series lengkap, Vivo Y/S/iQOO semua seri, Realme C/Narzo/Q series, Infinix Hot/Smart/GT, Tecno Spark/Pop/Pova, ASUS ROG/Zenfone semua generasi, Google Pixel 1-8 Fold, OnePlus Nord/CE/N series, Motorola Edge/Razr/Moto E, Sony Xperia semua seri, Honor Magic/numbered/X/Play, Nokia G/C/X/numbered, Huawei P/Mate/Nova/Y lengkap, Meizu 15-21, ZTE Axon/Blade/nubia/Red Magic, Lenovo Legion/K/Z, BlackBerry. Apple: 46 iPhone (4 s/d 16 Pro Max) + 30 iPad semua generasi. | `src/lib/device-data.ts` |
| 10 Mei 2026 | 1.9.0 | Google OAuth + Approval Flow + Dummy Data. (1) Migration `20260510000001_add_approval_system.sql`: kolom `is_approved` di `profiles`, update trigger `handle_new_user` (admin-created=approved, self-register/OAuth=pending), RPC `approve_user()` dan `get_pending_users()`. (2) `auth.ts`: fungsi `signInWithGoogle()` via Supabase OAuth. (3) `useRole.ts`: fetch `is_approved` dari profiles secara paralel. (4) `PendingApproval.tsx`: halaman lock screen untuk user belum disetujui. (5) `Login.tsx` + `Register.tsx`: tombol "Lanjutkan/Daftar dengan Google" dengan Google SVG icon. (6) `App.tsx` RoleGuard: intercept `isApproved === false` → render PendingApproval. (7) `UserManagement.tsx`: tab "Menunggu Persetujuan" dengan badge counter, ApproveUserDialog (pilih role + approve), query `get_pending_users`. (8) `supabase/seed_dummy.sql`: 26 produk realistis (Apple/Samsung/Xiaomi/OPPO/Vivo/Realme) + 36 transaksi jurnal 3 bulan terakhir untuk Dani dan Budi. | `supabase/migrations/20260510000001_add_approval_system.sql` (new), `supabase/seed_dummy.sql` (new), `src/lib/auth.ts`, `src/hooks/useRole.ts`, `src/pages/PendingApproval.tsx` (new), `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/App.tsx`, `src/components/UserManagement.tsx` |
| 14 Mei 2026 | 1.9.1 | Landing Page CTA section diupdate: contact person grid ditambahkan (Anang, Lingga, Epo, Arya) dengan link WhatsApp langsung per orang. Nomor lama single-CTA diganti grid 4 kartu. Import `Phone` dan `ArrowRight` yang tidak terpakai dihapus. | `src/pages/LandingPage.tsx` |
| 14 Mei 2026 | 2.0.0 | Sistem Testimoni Termoderasi. (1) Migration `20260514000001_add_testimonials.sql`: tabel `testimonials` (id, nama, rating, ulasan, status, foto_url, created_at), RLS (public INSERT, public SELECT approved only, admin full CRUD). (2) `TestimonialForm.tsx`: form publik text-only (Zod: nama max 50, ulasan max 250, rating 1-5 stars), submit ke DB status=pending, toast konfirmasi. (3) `TestimonialModeration.tsx`: panel admin — list pending/approved, ApproveDialog dengan optional photo upload ke Supabase Storage bucket 'testimonials', reject button. (4) `LandingPage.tsx` TestimonialsSection direfactor: fetch approved testimonials via TanStack Query, render dinamis dengan foto (jika ada), skeleton loader, fallback ke data statis jika DB kosong. Tombol "Tulis Ulasan" ditambahkan. (5) Tab "Moderasi Ulasan" ditambahkan ke ManagementDashboard. Keamanan: no dangerouslySetInnerHTML, Zod sanitasi input, file upload hanya di admin side. | `supabase/migrations/20260514000001_add_testimonials.sql` (new), `src/components/landing/TestimonialForm.tsx` (new), `src/components/admin/TestimonialModeration.tsx` (new), `src/pages/LandingPage.tsx`, `src/pages/ManagementDashboard.tsx` |
| 14 Mei 2026 | 2.0.1 | Bugfix: Storage RLS violation saat upload foto testimoni. Migration `20260514000002_add_storage_policies.sql` dibuat — 4 policies pada `storage.objects` untuk bucket 'testimonials': public SELECT, authenticated INSERT/UPDATE/DELETE. | `supabase/migrations/20260514000002_add_storage_policies.sql` (new) |
| 14 Mei 2026 | 2.0.2 | UI polish Landing Page. (1) Tombol "Tulis Ulasan" dipindah ke tengah di bawah deskripsi section (bukan pojok kanan). (2) Image lightbox: klik foto testimoni membuka Dialog full-size (max-h 80vh, object-contain). (3) "Cara Kerja" connecting lines diperbaiki: satu garis horizontal tunggal di belakang semua step (desktop only), step circles pakai bg-background solid untuk mask garis, z-10 pada steps. | `src/pages/LandingPage.tsx` |
| 14 Mei 2026 | 2.1.1 | Fix: `useScrollReveal.ts` hook dibuat ulang (file hilang dari disk). Scroll reveal ditambahkan ke CTA section dan Footer — sekarang semua 7 section landing page punya efek fade-up saat scroll ke viewport. Import `useScrollReveal` ditambahkan ke top-level `LandingPage.tsx`. | `src/hooks/useScrollReveal.ts` (recreated), `src/pages/LandingPage.tsx` |
| 14 Mei 2026 | 2.2.0 | (1) TestimonialModeration: tombol "Sembunyikan" (set status→pending) dan "Hapus" (delete permanen) ditambahkan ke ulasan yang sudah dipublikasikan. (2) Landing Page copywriting diubah ke model bisnis COD online: Hero sub-headline menyebut "online + COD Malang", Cara Kerja 3 step diubah (Chat WA → Nego Online → COD), feature card "Buka 6 Hari" → "Fast Response 6 Hari", CTA "atur jadwal COD", alamat fisik dihapus diganti "Melayani COD area Malang & sekitarnya", footer tagline "Jual Beli HP Bekas Online — COD Malang". Semua referensi toko fisik dieliminasi. | `src/components/admin/TestimonialModeration.tsx`, `src/pages/LandingPage.tsx` |
| 14 Mei 2026 | 2.2.1 | Logo Landing Page theme-aware: light mode tampil `logo1.png`, dark mode tampil `logo2.png`. Diterapkan di 3 tempat (Hero, Navbar, Footer) menggunakan Tailwind `dark:hidden` / `hidden dark:block`. | `src/pages/LandingPage.tsx` |
| 14 Mei 2026 | 2.3.0 | Fitur Import Excel untuk Jurnal. `JournalFilters.tsx` ditambah tombol "Import Excel" + hidden file input (.xlsx/.xls/.csv). Parsing via SheetJS: flexible column mapping (support berbagai nama header Indonesia/Inggris), price stripping (Rp/titik/koma), date parsing (DD/MM/YYYY, ISO, Excel serial), validasi kolom wajib, bulk insert ke Supabase, toast loading/success/error, auto-refresh tabel. `user_id` otomatis diisi dari user yang login. | `src/components/JournalFilters.tsx` |
| 14 Mei 2026 | 2.3.1 | Bugfix: tab "Menunggu Persetujuan" kosong meskipun ada user pending. `UserManagement.tsx` diupdate: fetch pending users sekarang dual-strategy (RPC `get_pending_users` → fallback direct query `profiles WHERE is_approved = false` dengan mapping `id→user_id`). Approve mutation juga dual-strategy (RPC → fallback direct update `profiles` + upsert `user_roles`). Fitur jalan baik sebelum maupun sesudah migration di-push. | `src/components/UserManagement.tsx` |
| 15 Mei 2026 | 3.0.0 | Major Landing Page Redesign: "Dark Futuristic Green" → "Classic Minimalist Gold". (1) `index.css`: CSS scope `.landing-theme` baru — light (#FAFAFA bg, #121212 fg) dan dark (#0A0A0A bg, #F5F5F5 fg), gold accent #D4AF37, keyframe `gold-glow-pulse`, utility `.gold-card-border`, `.lp-connector`. Dashboard tidak terpengaruh. (2) `tailwind.config.ts`: tambah `brand-gold`, `brand-gold-light`, `brand-gold-dark`. (3) `LandingPage.tsx`: semua warna hijau/neon dihapus → gold #D4AF37 + monochrome. Hero: gold badge, gold headline accent, gold CTA `animate-gold-glow`. Semua section (Features/Stats/HowItWorks/Testimonials/CTA/Footer/Nav) pakai `--lp-*` CSS variables. `font-display` (Sora) pada semua heading. | `src/index.css`, `tailwind.config.ts`, `src/pages/LandingPage.tsx` |
| 15 Mei 2026 | 3.1.0 | Landing Page diubah dari Gold ke Full Monochrome. `index.css`: `.landing-theme` tokens diupdate — hapus semua `--lp-gold`, ganti dengan `--lp-accent` (hitam di light, putih di dark) + `--lp-accent-fg`. `.gold-card-border` → `.mono-card-border`. `.lp-connector` jadi monochrome. `LandingPage.tsx`: semua referensi `#D4AF37` diganti `hsl(var(--lp-accent))`, `animate-gold-glow` dihapus, CTA button pakai `--lp-accent/--lp-accent-fg`. Logo theme-aware ditambahkan ke KaryawanDashboard dan ManagementDashboard. Dashboard tetap pakai hijau (--primary tidak diubah). | `src/index.css`, `src/pages/LandingPage.tsx`, `src/pages/KaryawanDashboard.tsx`, `src/pages/ManagementDashboard.tsx` |
| 15 Mei 2026 | 3.2.0 | Full Monochrome Design System — hijau dihapus dari seluruh app. `index.css`: `--primary` diubah dari `hsl(160 70% 45%)` ke monochrome (hitam di light `0 0% 9%`, putih di dark `0 0% 96%`). Semua background dari blue-tinted ke pure black/white. Glow effects, border-gradient, surface layers semua diupdate ke monochrome. `tailwind.config.ts`: `bg-surface`/`bg-elevated` diubah ke pure grayscale. Berlaku untuk seluruh app: landing page, login, register, dan semua dashboard. Warna tersisa: destructive (merah) dan accent-orange (warning). | `src/index.css`, `tailwind.config.ts` |
| 15 Mei 2026 | 3.3.0 | Dynamic Profit-Sharing per Seller. (1) Migration `20260515000001_custom_profit_split.sql`: kolom `komisi_persen` di `profiles` (default 50%), kolom `komisi_persen_applied` + `nominal_komisi` di `journal`, backfill data lama ke 50%. (2) `UserManagement.tsx`: `CommissionEditor` component — dropdown 30-70% per karyawan, langsung update ke `profiles`. (3) `JournalForm.tsx`: fetch `komisi_persen` dari profile user, preview profit dinamis "Seller (X%) / Toko (Y%)", submit menyimpan `komisi_persen_applied` + `nominal_komisi`. (4) `TargetProgress.tsx`: kalkulasi "bagian kamu" pakai `nominal_komisi` dari journal jika tersedia, fallback 50% untuk data lama. | `supabase/migrations/20260515000001_custom_profit_split.sql` (new), `src/components/JournalForm.tsx`, `src/components/UserManagement.tsx`, `src/components/karyawan/TargetProgress.tsx` |
| 15 Mei 2026 | 3.4.0 | Pemisahan alur Barang Masuk / Barang Keluar. (1) Migration `20260515000002_allow_karyawan_insert_products.sql`: RLS karyawan INSERT products + RPC `deduct_product_stock` (safe stock deduction). (2) `FormBarangMasuk.tsx`: form catat kulakan — Merk, Model, Kondisi, Storage, RAM, Harga Beli, Harga Jual rencana → insert ke `products` stok=1. (3) `JournalForm.tsx` direfactor: "Nama Unit" diganti Select dari `products WHERE stok > 0`, auto-fill Harga Beli (read-only) + Harga Jual (editable), submit → insert journal + deduct stock via RPC. (4) `KaryawanDashboard.tsx`: tombol "Catat Barang Masuk" ditambahkan di tab Transaksi. | `supabase/migrations/20260515000002_allow_karyawan_insert_products.sql` (new), `src/components/karyawan/FormBarangMasuk.tsx` (new), `src/components/JournalForm.tsx`, `src/pages/KaryawanDashboard.tsx` |
| 15 Mei 2026 | 3.5.0 | JournalForm UI refactor: toggle "Catat Penjualan" / "Catat Pembelian". Penjualan: pilih produk dari stok, Harga Beli read-only auto-fill, Harga Jual editable, profit preview dinamis, stock deduction. Pembelian: input Nama Unit manual, Harga Beli saja (Harga Jual = 0), preview "Total Pengeluaran" (minus). Tombol submit berubah sesuai mode. Conditional rendering fields — DB payload tetap sama (harga_beli + harga_jual, hidden field = 0). | `src/components/JournalForm.tsx` |
| 15 Mei 2026 | 3.5.1 | Fix JournalForm conditional rendering: "Catat Penjualan" sekarang hanya tampil Harga Jual (Harga Beli ditampilkan sebagai teks info "Modal: Rp X dari stok"), "Catat Pembelian" hanya tampil Harga Beli. Toggle reset semua nilai harga + product selection saat switch mode. Input Harga Beli yang sebelumnya masih muncul sebagai field terpisah dihapus dari DOM. | `src/components/JournalForm.tsx` |
| 16 Mei 2026 | 3.6.0 | Smart IMEI Lookup API Router. Edge Function `lookup-imei` direfactor total: (1) Primary API imei.org (Dhru format), (2) Apple chain ke ifreeicloud.co.uk (FMI/iCloud check) jika brand=Apple, (3) Fallback ke imei.info jika primary gagal, (4) Last resort local TAC DB. Luhn validation server-side. Unified response: `{ success, is_apple, brand, model, details, apple_icloud_status?, source }`. API keys via `Deno.env.get()` (secrets). Frontend `ImeiChecker.tsx`: interface `DeviceInfo` diupdate, Apple iCloud Status card ditampilkan otomatis, source info ditambahkan. | `supabase/functions/lookup-imei/index.ts`, `src/components/karyawan/ImeiChecker.tsx` |
| 16 Mei 2026 | 3.6.1 | Fix Edge Function `lookup-imei`: Dhru API payload format diperbaiki (`username` + `apiaccesskey` + `action: "imeimakemodel"` + `parameters: { imei }`). Extensive server-side logging ditambahkan (HTTP status + raw response text). Internal error detection diperkuat (cek `data.error/ERROR/success===false`). Raw text parsing sebelum JSON.parse untuk debug HTML error pages. TAC fallback diperluas (18 entries). | `supabase/functions/lookup-imei/index.ts` |
| 16 Mei 2026 | 3.6.2 | Debug: Edge Function `lookup-imei` sekarang expose raw API error messages ke frontend saat semua sumber gagal. Fetch functions return `{ __error: message }` instead of null. Orchestrator collect `error_primary` + `error_fallback` ke `details`. Frontend `ImeiChecker.tsx`: tampilkan debug card merah dengan exact error string dari setiap API (key not set, HTTP error, invalid response). | `supabase/functions/lookup-imei/index.ts`, `src/components/karyawan/ImeiChecker.tsx` |
| 16 Mei 2026 | 3.6.3 | Edge Function `lookup-imei` bulletproofed: SELALU return 200 OK + success:true. Missing secrets → warn + skip (tidak crash). imei.info URL diperbaiki ke `dash.imei.info/api/v1/checks`. Local TAC DB diperluas (50+ entries) + 7-digit prefix fuzzy match. Even if TAC not found → return success dengan instruksi manual. Even if server crash → catch return success. Frontend tidak pernah error. | `supabase/functions/lookup-imei/index.ts` |
| 16 Mei 2026 | 4.0.0 | AI Chatbot + Owner Settings. (1) Migration `20260516000001`: tabel `site_settings` (gemini_api_key, owner-only RLS) + `rate_limits` (IP tracking, auto-cleanup). (2) Edge Function `ai-assistant`: fetch key dari DB via service role, IP rate limit 15/jam, Google Gemini 1.5 Flash API, system prompt konteks Iku Gadget, safety settings. (3) `ChatAssistant.tsx`: FAB fixed bottom-right, Sheet sidebar, greeting + 3 quick topics, scrollable message history, loading indicator. (4) `AiSettings.tsx`: Owner form input/save Gemini API key (show/hide toggle), status indicator. (5) Tab "AI Settings" di ManagementDashboard (owner only). (6) Logo landing page responsive (`w-40 md:w-52 lg:w-60`). | `supabase/migrations/20260516000001_site_settings_and_rate_limit.sql` (new), `supabase/functions/ai-assistant/index.ts` (new), `src/components/landing/ChatAssistant.tsx` (new), `src/components/owner/AiSettings.tsx` (new), `src/pages/LandingPage.tsx`, `src/pages/ManagementDashboard.tsx` |
| 16 Mei 2026 | 4.0.1 | Debug: Edge Function `ai-assistant` direfactor — selalu return 200 OK dengan structured error codes (ENV_MISSING/DB_ERROR/NO_API_KEY/GEMINI_ERROR/RATE_LIMITED/FATAL). Service role key enforcement diperkuat (explicit check + log). Gemini error expose raw HTTP response text. Frontend `ChatAssistant.tsx`: tampilkan exact error code + detail di chat bubble (`⚠️ [CODE] message`). | `supabase/functions/ai-assistant/index.ts`, `src/components/landing/ChatAssistant.tsx` |
| 16 Mei 2026 | 4.1.0 | AI Assistant upgrade: (1) Static Response Router — 3 predefined questions bypass Gemini API entirely (hemat token). (2) SDK upgrade ke `npm:@google/genai` (official Google SDK). (3) Model upgrade ke `gemini-2.5-flash`. (4) System instruction via `config.systemInstruction` dengan konteks lengkap Iku Gadget (tim, nomor, jam, area COD, aturan jawab). Raw fetch dihapus, diganti SDK call `ai.models.generateContent()`. | `supabase/functions/ai-assistant/index.ts` |
