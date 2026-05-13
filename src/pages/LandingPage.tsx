/**
 * LandingPage.tsx — Halaman publik Iku Gadget & Stuff
 * Dapat diakses tanpa login. Route: /
 *
 * Sections:
 *  1. Hero
 *  2. Kenapa Iku Gadget?
 *  3. Statistik / Social Proof
 *  4. Cara Kerja
 *  5. Testimoni
 *  6. CTA Penutup
 *  7. Footer
 */

import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Zap,
  BadgeCheck,
  Clock,
  MessageCircle,
  ChevronRight,
  MapPin,
  Star,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import logo from "@/assets/logo.png";
import LandingDarkModeToggle from "@/components/landing/DarkModeToggle";
import { supabase } from "@/integrations/supabase/client";

// ─── Constants ────────────────────────────────────────────────
const WA_NUMBER = "6281234567890"; // nomor utama (hero CTA)
const WA_LINK   = `https://wa.me/${WA_NUMBER}?text=Halo%20Iku%20Gadget%2C%20saya%20ingin%20tanya%20tentang%20HP%20bekas`;

const STORE_ADDRESS = "Jl. Contoh No. 123, Kota Anda";
const STORE_HOURS   = "Senin–Sabtu: 09.00–18.00 WIB";

// ─── Contact Persons ──────────────────────────────────────────
const WA_TEXT = encodeURIComponent("Halo, saya ingin tanya tentang HP bekas di Iku Gadget");

const CONTACTS = [
  { name: "Anang",  number: "628817053043" },
  { name: "Lingga", number: "6282142119783" },
  { name: "Epo",    number: "6282245070900" },
  { name: "Arya",   number: "62882010490576" },
] as const;

// ─── Section 1: Hero ──────────────────────────────────────────
function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay bg-gradient-to-br from-background via-card to-background dark:from-[hsl(222_47%_6%)] dark:via-[hsl(222_40%_10%)] dark:to-[hsl(215_50%_8%)]"
    >
      {/* Decorative glow blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20 dark:opacity-20"
        style={{
          background:
            "radial-gradient(circle, hsl(160 70% 45%) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-15 dark:opacity-15"
        style={{
          background:
            "radial-gradient(circle, hsl(200 90% 55%) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo */}
        <div className="animate-fade-in flex justify-center mb-6">
          <img
            src={logo}
            alt="Iku Gadget & Stuff"
            width={72}
            height={72}
            className="rounded-2xl shadow-lg glow-primary-sm"
          />
        </div>

        {/* Badge */}
        <div className="animate-fade-up flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            Terpercaya sejak 2021
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-delay-1 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-foreground">
          Jual HP Lamamu,{" "}
          <span className="text-primary">Dapat Harga Terbaik.</span>
          <br />
          Beli HP Bekas,{" "}
          <span className="text-brand-secondary">Terjamin Kualitasnya.</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-up-delay-2 mx-auto max-w-xl text-base sm:text-lg mb-8 text-muted-foreground">
          Iku Gadget & Stuff — toko jual beli HP bekas terpercaya dengan proses
          cepat, harga transparan, dan garansi fungsi untuk setiap perangkat.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105 glow-primary"
          >
            <MessageCircle className="h-4 w-4" />
            Hubungi via WhatsApp
          </a>
          <a
            href="#cara-kerja"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-6 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-accent"
          >
            Pelajari Lebih Lanjut
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce"
        aria-hidden="true"
      >
        <div className="h-8 w-5 rounded-full border-2 border-border flex items-start justify-center pt-1">
          <div className="h-2 w-1 rounded-full bg-primary" />
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: Kenapa Iku Gadget? ────────────────────────────
const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Harga Transparan",
    desc: "Tidak ada biaya tersembunyi. Harga yang kami tawarkan sudah final dan bisa dinegosiasi secara terbuka.",
    color: "hsl(160 70% 45%)",
  },
  {
    icon: ShieldCheck,
    title: "Garansi Fungsi",
    desc: "Setiap HP bekas yang kami jual sudah melalui pengecekan menyeluruh dan bergaransi fungsi 7 hari.",
    color: "hsl(200 90% 55%)",
  },
  {
    icon: Zap,
    title: "Proses Cepat",
    desc: "Dari cek kondisi hingga transaksi selesai, prosesnya bisa kurang dari 30 menit.",
    color: "hsl(28 90% 55%)",
  },
  {
    icon: Clock,
    title: "Buka 6 Hari Seminggu",
    desc: "Kami buka Senin–Sabtu pukul 09.00–18.00. Bisa juga janjian di luar jam operasional.",
    color: "hsl(160 70% 45%)",
  },
] as const;

function FeaturesSection() {
  return (
    <section id="keunggulan" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
            Kenapa Pilih Iku Gadget?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Kami hadir untuk membuat jual beli HP bekas jadi lebih mudah dan aman.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-xl p-5 bg-secondary border border-border transition-all duration-200 hover:-translate-y-1 hover:glow-primary-sm"
            >
              <div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: `${color}1a` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <h3 className="font-semibold mb-2 text-sm text-foreground">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Statistik / Social Proof ──────────────────────
const STATS = [
  { icon: TrendingUp, value: "500+",  label: "Transaksi Selesai",  color: "hsl(160 70% 45%)" },
  { icon: Star,       value: "4.9/5", label: "Rating Pelanggan",   color: "hsl(28 90% 55%)"  },
  { icon: Users,      value: "300+",  label: "Pelanggan Puas",     color: "hsl(200 90% 55%)" },
  { icon: Smartphone, value: "3 Thn", label: "Beroperasi",         color: "hsl(160 70% 45%)" },
] as const;

function StatsSection() {
  return (
    <section id="statistik" className="py-16 bg-gradient-to-b from-card to-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, value, label, color }) => (
            <div
              key={label}
              className="rounded-xl p-6 text-center bg-card border border-border"
            >
              <Icon className="mx-auto mb-3 h-6 w-6" style={{ color }} />
              <p className="font-mono text-3xl font-bold mb-1 text-foreground">
                {value}
              </p>
              <p className="text-xs text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Cara Kerja ────────────────────────────────────
const STEPS = [
  {
    num: "01",
    title: "Datang ke Toko",
    desc: "Bawa HP yang ingin dijual atau kunjungi toko kami untuk melihat koleksi HP bekas pilihan.",
  },
  {
    num: "02",
    title: "Cek & Negosiasi Harga",
    desc: "Tim kami akan mengecek kondisi HP secara menyeluruh dan memberikan penawaran harga terbaik.",
  },
  {
    num: "03",
    title: "Transaksi Selesai",
    desc: "Setuju dengan harga? Transaksi langsung selesai. Pembayaran tunai atau transfer bank.",
  },
] as const;

function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
            Cara Kerjanya Simpel
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tiga langkah mudah untuk jual atau beli HP bekas di Iku Gadget.
          </p>
        </div>

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-0">
          {STEPS.map(({ num, title, desc }, idx) => (
            <div key={num} className="flex-1 flex flex-col lg:items-center lg:text-center relative">
              {/* Connector line (desktop only) */}
              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="hidden lg:block absolute top-6 left-[calc(50%+2.5rem)] right-0 h-px bg-gradient-to-r from-primary/50 to-border"
                />
              )}

              {/* Step number */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold mb-4 glow-primary-sm bg-primary/15 border border-primary/40 text-primary">
                {num}
              </div>

              <div className="lg:px-6">
                <h3 className="font-semibold mb-2 text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: Testimoni (Dynamic from DB) ──────────────────
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import TestimonialForm from "@/components/landing/TestimonialForm";

interface DbTestimonial {
  id: string;
  nama: string;
  rating: number;
  ulasan: string;
  foto_url: string | null;
  created_at: string;
}

// Static fallback (shown if DB has no approved testimonials yet)
const FALLBACK_TESTIMONIALS = [
  { name: "Rizky A.", avatar: "RA", rating: 5, text: "Prosesnya cepat banget, cuma 20 menit dari datang sampai uang di tangan. Harganya juga fair, tidak jauh dari ekspektasi saya." },
  { name: "Siti M.", avatar: "SM", rating: 5, text: "Beli HP bekas di sini dan sudah 3 bulan masih mulus. Garansi fungsinya beneran dipenuhi, bukan cuma janji." },
  { name: "Budi S.", avatar: "BS", rating: 5, text: "Sudah 2 kali jual HP di sini. Pelayanannya ramah, tidak ada tekanan, dan harganya selalu kompetitif." },
] as const;

function TestimonialsSection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dbTestimonials, isLoading } = useQuery<DbTestimonial[]>({
    queryKey: ["testimonials-public"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("testimonials")
        .select("id, nama, rating, ulasan, foto_url, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) return [];
      return data ?? [];
    },
    staleTime: 60_000, // 1 min cache
  });

  const hasDbData = (dbTestimonials?.length ?? 0) > 0;

  return (
    <section id="testimoni" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
              Kata Pelanggan Kami
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Kepercayaan pelanggan adalah prioritas utama kami.
            </p>
          </div>
          <TestimonialForm />
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-5 bg-secondary border border-border space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Dynamic testimonials from DB */}
        {!isLoading && hasDbData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dbTestimonials!.map((t) => (
              <div
                key={t.id}
                className="rounded-xl p-5 border-gradient transition-all duration-200 hover:-translate-y-1 bg-secondary border border-border"
              >
                {/* Photo if available */}
                {t.foto_url && (
                  <img
                    src={t.foto_url}
                    alt={`Transaksi ${t.nama}`}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                    loading="lazy"
                  />
                )}

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current text-accent-orange" />
                  ))}
                </div>

                {/* Text — rendered as plain text, no dangerouslySetInnerHTML */}
                <p className="text-sm leading-relaxed mb-4 text-muted-foreground">
                  "{t.ulasan}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-primary/20 text-primary">
                    {t.nama.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{t.nama}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Static fallback when DB is empty */}
        {!isLoading && !hasDbData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FALLBACK_TESTIMONIALS.map(({ name, avatar, rating, text }) => (
              <div
                key={name}
                className="rounded-xl p-5 border-gradient transition-all duration-200 hover:-translate-y-1 bg-secondary border border-border"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current text-accent-orange" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 text-muted-foreground">"{text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-primary/20 text-primary">
                    {avatar}
                  </div>
                  <span className="text-sm font-medium text-foreground">{name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Section 6: CTA Penutup ───────────────────────────────────
function CtaSection() {
  return (
    <section id="kontak" className="py-20 bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto max-w-2xl rounded-2xl p-8 sm:p-12 bg-card border border-border shadow-lg">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
            Siap Transaksi Sekarang?
          </h2>
          <p className="text-sm sm:text-base mb-8 text-muted-foreground">
            Hubungi salah satu tim kami via WhatsApp atau langsung datang ke toko.
          </p>

          {/* Contact Person Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {CONTACTS.map(({ name, number }) => (
              <a
                key={name}
                href={`https://wa.me/${number}?text=${WA_TEXT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/5 hover:glow-primary-sm group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {`0${number.replace(/^62/, "")}`}
                </span>
              </a>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {STORE_HOURS}
            </span>
            <span className="hidden sm:block" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {STORE_ADDRESS}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: Footer ────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="py-8 border-t border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Iku Gadget & Stuff"
              width={32}
              height={32}
              className="rounded-lg"
              loading="lazy"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Iku Gadget & Stuff
              </p>
              <p className="text-xs text-muted-foreground">
                Jual Beli HP Bekas Terpercaya
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {STORE_ADDRESS}
          </div>

          {/* Login link + copyright */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <Link
              to="/login"
              className="text-xs text-primary transition-colors hover:underline"
            >
              Login Sistem →
            </Link>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} Iku Gadget & Stuff
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Sticky Navbar (anchor links) ────────────────────────────
function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="Iku Gadget"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="text-sm font-semibold text-foreground">
            Iku Gadget
          </span>
        </div>

        {/* Anchor links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          {[
            { href: "#keunggulan", label: "Keunggulan" },
            { href: "#cara-kerja", label: "Cara Kerja" },
            { href: "#testimoni",  label: "Testimoni"  },
            { href: "#kontak",     label: "Kontak"     },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LandingDarkModeToggle />
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Page Composition ─────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* SEO meta tags are handled via index.html */}
      <header>
        <LandingNav />
      </header>

      {/* Offset for fixed nav */}
      <main className="pt-14">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
