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
import logoLight from "@/assets/logo1.png";
import logoDark from "@/assets/logo2.png";
import LandingDarkModeToggle from "@/components/landing/DarkModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ─── Constants ────────────────────────────────────────────────
const WA_NUMBER = "6281234567890"; // nomor utama (hero CTA)
const WA_LINK   = `https://wa.me/${WA_NUMBER}?text=Halo%20Iku%20Gadget%2C%20saya%20ingin%20tanya%20tentang%20HP%20bekas`;

const STORE_ADDRESS = "Jl. Cemara Tidar J2 No. 29, Kota Malang";
const STORE_HOURS   = "Senin–Sabtu: 09.00–21.00 WIB";

// ─── Contact Persons ──────────────────────────────────────────
const WA_TEXT = encodeURIComponent("Halo, saya ingin tanya tentang HP bekas di Iku Gadget");

const CONTACTS = [
  { name: "Lingga",  number: "628817053043" },
  { name: "Epo", number: "6282142119783" },
  { name: "Arya",    number: "6282245070900" },
  { name: "Anang",   number: "62882010490576" },
] as const;

// ─── Section 1: Hero ──────────────────────────────────────────
function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "hsl(var(--lp-bg))" }}
    >
      {/* Subtle gold glow blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, hsl(var(--lp-accent)) 0%, transparent 70%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, hsl(var(--lp-accent)) 0%, transparent 70%)" }} />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo */}
        <div className="animate-fade-in flex justify-center mb-8">
          <img src={logoLight} alt="Iku Gadget & Stuff" className="w-40 md:w-52 lg:w-60 h-auto object-contain dark:hidden" />
          <img src={logoDark}  alt="Iku Gadget & Stuff" className="w-40 md:w-52 lg:w-60 h-auto object-contain hidden dark:block" />
        </div>

        {/* Badge */}
        <div className="animate-fade-up flex justify-center mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ border: "1px solid hsl(var(--lp-accent))60", background: "hsl(var(--lp-accent))15", color: "hsl(var(--lp-accent))" }}>
            <BadgeCheck className="h-3.5 w-3.5" />
            Terpercaya sejak 2021
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-delay-1 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5"
          style={{ color: "hsl(var(--lp-fg))" }}>
          Jual HP Lamamu,{" "}
          <span style={{ color: "hsl(var(--lp-accent))" }}>Dapat Harga Terbaik.</span>
          <br />
          Beli HP Bekas,{" "}
          <span style={{ color: "hsl(var(--lp-accent))" }}>Terjamin Kualitasnya.</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-up-delay-2 mx-auto max-w-xl text-base sm:text-lg mb-8"
          style={{ color: "hsl(var(--lp-fg-muted))" }}>
          Iku Gadget & Stuff — jual beli HP bekas online terpercaya. Proses cepat via WhatsApp,
          harga transparan, garansi fungsi. COD area Malang.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{ background: "hsl(var(--lp-accent))", color: "hsl(var(--lp-accent-fg))" }}
          >
            <MessageCircle className="h-4 w-4" />
            Hubungi via WhatsApp
          </a>
          <a
            href="#cara-kerja"
            className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold transition-all duration-300"
            style={{ border: "1px solid hsl(var(--lp-border))", color: "hsl(var(--lp-fg))" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsl(var(--lp-accent))80")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsl(var(--lp-border))")}
          >
            Pelajari Lebih Lanjut
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce" aria-hidden="true">
        <div className="h-8 w-5 rounded-full flex items-start justify-center pt-1"
          style={{ border: "2px solid hsl(var(--lp-border))" }}>
          <div className="h-2 w-1 rounded-full" style={{ background: "hsl(var(--lp-accent))" }} />
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
    color: "hsl(var(--lp-accent))",
  },
  {
    icon: ShieldCheck,
    title: "Garansi Fungsi",
    desc: "Setiap HP bekas yang kami jual sudah melalui pengecekan menyeluruh dan bergaransi fungsi 7 hari.",
    color: "hsl(var(--lp-accent))",
  },
  {
    icon: Zap,
    title: "Proses Cepat",
    desc: "Dari cek kondisi hingga transaksi selesai, prosesnya bisa kurang dari 30 menit.",
    color: "hsl(var(--lp-accent))",
  },
  {
    icon: Clock,
    title: "Fast Response 6 Hari",
    desc: "Tim kami aktif Senin–Sabtu pukul 09.00–21.00. Chat kapan saja, kami balas cepat!",
    color: "hsl(var(--lp-accent))",
  },
] as const;

function FeaturesSection() {
  return (
    <section id="keunggulan" className="py-20" style={{ backgroundColor: "hsl(var(--lp-bg-card))" }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: "hsl(var(--lp-fg))" }}>
            Kenapa Pilih Iku Gadget?
          </h2>
          <p className="text-sm sm:text-base" style={{ color: "hsl(var(--lp-fg-muted))" }}>
            Kami hadir untuk membuat jual beli HP bekas jadi lebih mudah dan aman.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="mono-card-border rounded-xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_hsl(var(--lp-fg) / 0.12)]"
              style={{ backgroundColor: "hsl(var(--lp-bg-elevated))" }}
            >
              <div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: `${color}1a` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <h3 className="font-semibold mb-2 text-sm" style={{ color: "hsl(var(--lp-fg))" }}>
                {title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--lp-fg-muted))" }}>
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
  { icon: TrendingUp, value: "500+",  label: "Transaksi Selesai",  color: "hsl(var(--lp-accent))" },
  { icon: Star,       value: "4.9/5", label: "Rating Pelanggan",   color: "hsl(var(--lp-accent))" },
  { icon: Users,      value: "300+",  label: "Pelanggan Puas",     color: "hsl(var(--lp-accent))" },
  { icon: Smartphone, value: "3 Thn", label: "Beroperasi",         color: "hsl(var(--lp-accent))" },
] as const;

function StatsSection() {
  return (
    <section id="statistik" className="py-16" style={{ backgroundColor: "hsl(var(--lp-bg))" }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, value, label, color }) => (
            <div
              key={label}
              className="rounded-xl p-6 text-center"
              style={{
                backgroundColor: "hsl(var(--lp-bg-card))",
                border: "1px solid hsl(var(--lp-border))",
              }}
            >
              <Icon className="mx-auto mb-3 h-6 w-6" style={{ color }} />
              <p className="font-mono text-3xl font-bold mb-1" style={{ color: "hsl(var(--lp-fg))" }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: "hsl(var(--lp-fg-muted))" }}>
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
    title: "Hubungi via WhatsApp",
    desc: "Kirim foto dan detail HP lamamu, atau tanyakan stok HP bekas yang tersedia. Tim kami fast response!",
  },
  {
    num: "02",
    title: "Negosiasi Online",
    desc: "Dapatkan estimasi harga terbaik langsung dari chat. Transparan, tanpa biaya tersembunyi.",
  },
  {
    num: "03",
    title: "Ketemuan (COD) & Transaksi",
    desc: "Cek kondisi fisik secara langsung di lokasi yang disepakati, lalu bayar di tempat. Aman dan nyaman.",
  },
] as const;

function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="py-20" style={{ backgroundColor: "hsl(var(--lp-bg))" }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: "hsl(var(--lp-fg))" }}>
            Cara Kerjanya Simpel
          </h2>
          <p className="text-sm sm:text-base" style={{ color: "hsl(var(--lp-fg-muted))" }}>
            Tiga langkah mudah untuk jual atau beli HP bekas di Iku Gadget.
          </p>
        </div>

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-0">
          {/* Single connecting line behind all steps — desktop only */}
          <div
            aria-hidden="true"
            className="lp-connector hidden lg:block absolute top-6 left-[16%] right-[16%] h-px -z-0"
          />

          {STEPS.map(({ num, title, desc }) => (
            <div key={num} className="flex-1 flex flex-col lg:items-center lg:text-center relative z-10 group">
              {/* Step number — solid bg to mask the line behind */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold mb-4 group-hover:shadow-[0_0_18px_hsl(var(--lp-fg) / 0.2)]"
                style={{ background: "hsl(var(--lp-bg))", border: "1px solid hsl(var(--lp-accent))60", color: "hsl(var(--lp-accent))" }}
              >
                {num}
              </div>

              <div className="lg:px-6">
                <h3 className="font-semibold mb-2" style={{ color: "hsl(var(--lp-fg))" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--lp-fg-muted))" }}>
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TestimonialForm from "@/components/landing/TestimonialForm";
import ChatAssistant from "@/components/landing/ChatAssistant";

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
    <section id="testimoni" className="py-20" style={{ backgroundColor: "hsl(var(--lp-bg-card))" }}>
      <div className="container mx-auto px-4">
        {/* Header — centered */}
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: "hsl(var(--lp-fg))" }}>
            Kata Pelanggan Kami
          </h2>
          <p className="text-sm sm:text-base mb-5" style={{ color: "hsl(var(--lp-fg-muted))" }}>
            Kepercayaan pelanggan adalah prioritas utama kami.
          </p>
          <TestimonialForm />
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl p-5 space-y-3"
                style={{
                  backgroundColor: "hsl(var(--lp-bg-elevated))",
                  border: "1px solid hsl(var(--lp-border))",
                }}
              >
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
                className="rounded-xl p-5 border-gradient transition-all duration-200 hover:-translate-y-1"
                style={{
                  backgroundColor: "hsl(var(--lp-bg-elevated))",
                  border: "1px solid hsl(var(--lp-border))",
                }}
              >
                {/* Photo with lightbox */}
                {t.foto_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <img
                        src={t.foto_url}
                        alt={`Transaksi ${t.nama}`}
                        className="w-full h-32 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl p-2 bg-card/95 backdrop-blur-sm">
                      <img
                        src={t.foto_url}
                        alt={`Transaksi ${t.nama}`}
                        className="w-full max-h-[80vh] object-contain rounded-lg"
                      />
                    </DialogContent>
                  </Dialog>
                )}

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current text-accent-orange" />
                  ))}
                </div>

                {/* Text — rendered as plain text, no dangerouslySetInnerHTML */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(var(--lp-fg-muted))" }}>
                  "{t.ulasan}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "hsl(var(--lp-accent))20", color: "hsl(var(--lp-accent))" }}
                  >
                    {t.nama.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium" style={{ color: "hsl(var(--lp-fg))" }}>{t.nama}</span>
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
                className="rounded-xl p-5 border-gradient transition-all duration-200 hover:-translate-y-1"
                style={{
                  backgroundColor: "hsl(var(--lp-bg-elevated))",
                  border: "1px solid hsl(var(--lp-border))",
                }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current text-accent-orange" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(var(--lp-fg-muted))" }}>"{text}"</p>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "hsl(var(--lp-accent))20", color: "hsl(var(--lp-accent))" }}
                  >
                    {avatar}
                  </div>
                  <span className="text-sm font-medium" style={{ color: "hsl(var(--lp-fg))" }}>{name}</span>
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
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section id="kontak" className="py-20" style={{ backgroundColor: "hsl(var(--lp-bg))" }}>
      <div className="container mx-auto px-4 text-center">
        <div
          ref={ref}
          className="reveal mx-auto max-w-2xl rounded-2xl p-8 sm:p-12 shadow-lg"
          style={{
            backgroundColor: "hsl(var(--lp-bg-card))",
            border: "1px solid hsl(var(--lp-border))",
          }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: "hsl(var(--lp-fg))" }}>
            Siap Transaksi Sekarang?
          </h2>
          <p className="text-sm sm:text-base mb-8" style={{ color: "hsl(var(--lp-fg-muted))" }}>
            Hubungi salah satu tim kami via WhatsApp untuk konsultasi harga dan atur jadwal COD.
          </p>

          {/* Contact Person Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {CONTACTS.map(({ name, number }) => (
              <a
                key={name}
                href={`https://wa.me/${number}?text=${WA_TEXT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 group"
                style={{
                  backgroundColor: "hsl(var(--lp-bg-elevated))",
                  border: "1px solid hsl(var(--lp-border))",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--lp-accent))80";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--lp-accent))08";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--lp-border))";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--lp-bg-elevated))";
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full transition-colors" style={{ background: "hsl(var(--lp-accent))15" }}>
                  <MessageCircle className="h-5 w-5" style={{ color: "hsl(var(--lp-accent))" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "hsl(var(--lp-fg))" }}>{name}</span>
                <span className="text-[10px] font-mono" style={{ color: "hsl(var(--lp-fg-muted))" }}>
                  {`0${number.replace(/^62/, "")}`}
                </span>
              </a>
            ))}
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm pt-4 border-t"
            style={{ color: "hsl(var(--lp-fg-muted))", borderColor: "hsl(var(--lp-border))" }}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {STORE_HOURS}
            </span>
            <span className="hidden sm:block" aria-hidden="true"></span>
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
  const ref = useScrollReveal<HTMLElement>();
  return (
    <footer
      ref={ref}
      className="reveal py-8 border-t"
      style={{
        backgroundColor: "hsl(var(--lp-bg))",
        borderColor: "hsl(var(--lp-border))",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src={logoLight}
              alt="Iku Gadget & Stuff"
              width={75}
              height={32}
              className="dark:hidden"
              loading="lazy"
            />
            <img
              src={logoDark}
              alt="Iku Gadget & Stuff"
              width={75}
              height={32}
              className="hidden dark:block"
              loading="lazy"
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--lp-fg))" }}>
                Iku Gadget & Stuff
              </p>
              <p className="text-xs" style={{ color: "hsl(var(--lp-fg-muted))" }}>
                Jual Beli HP Bekas Online — COD Malang
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--lp-fg-muted))" }}>
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {STORE_ADDRESS}
          </div>

          {/* Login link + copyright */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <Link
              to="/login"
              className="text-xs transition-colors hover:underline"
              style={{ color: "hsl(var(--lp-accent))" }}
            >
              Login Sistem →
            </Link>
            <p className="text-xs" style={{ color: "hsl(var(--lp-fg-muted) / 0.7)" }}>
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
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: "hsl(var(--lp-bg) / 0.9)",
        borderColor: "hsl(var(--lp-border))",
      }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          <img
            src={logoLight}
            alt="Iku Gadget"
            width={50}
            height={28}
            className="dark:hidden"
          />
          <img
            src={logoDark}
            alt="Iku Gadget"
            width={50}
            height={28}
            className="hidden dark:block"
          />
          <span className="text-sm font-semibold" style={{ color: "hsl(var(--lp-fg))" }}>
            Iku Gadget
          </span>
        </div>

        {/* Anchor links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium">
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
              style={{ color: "hsl(var(--lp-fg-muted))" }}
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
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105"
            style={{ background: "hsl(var(--lp-accent))", color: "hsl(var(--lp-accent-fg))" }}
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
    <div className="landing-theme min-h-screen" style={{ backgroundColor: "hsl(var(--lp-bg))", color: "hsl(var(--lp-fg))" }}>
      <header>
        <LandingNav />
      </header>
      <main className="pt-14">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <LandingFooter />
      <ChatAssistant />
    </div>
  );
}
