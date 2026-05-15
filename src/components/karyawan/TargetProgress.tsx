import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Award, TrendingUp, CalendarDays } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface IncentiveConfig {
  target_units: number;
  bonus_percentage: number;
}

interface JournalEntry {
  tanggal: string;
  harga_jual: number | string;
  harga_beli: number | string;
  biaya_operasional: number | string;
}

interface TargetProgressProps {
  /** All journal entries for this karyawan (already fetched in parent) */
  entries: JournalEntry[];
}

const formatRp = (n: number) => `Rp ${Math.abs(n).toLocaleString("id-ID")}`;

// ─── Animated Progress Bar ────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0);

  // Trigger animation after mount
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(pct, 100)), 80);
    return () => clearTimeout(t);
  }, [pct]);

  const color =
    pct >= 100
      ? "from-primary to-primary"
      : pct >= 60
      ? "from-chart-unit to-primary"
      : "from-chart-unit to-brand-secondary";

  return (
    <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-[600ms] ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── Days remaining in current month ─────────────────────────
function daysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

// ─── Main Component ───────────────────────────────────────────
export default function TargetProgress({ entries }: TargetProgressProps) {
  // Fetch incentive config
  const { data: config } = useQuery<IncentiveConfig | null>({
    queryKey: ["incentive-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incentive_config")
        .select("target_units, bonus_percentage")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as IncentiveConfig | null;
    },
    staleTime: 5 * 60 * 1000, // 5 min — config rarely changes
  });

  if (!config) return null;

  // ── Filter to current month ───────────────────────────────
  const now = new Date();
  const monthEntries = entries.filter((e) => {
    const d = new Date(e.tanggal);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const unitsSold = monthEntries.length;
  const targetUnits = config.target_units;
  const pct = targetUnits > 0 ? (unitsSold / targetUnits) * 100 : 0;
  const achieved = unitsSold >= targetUnits;
  const daysLeft = daysRemainingInMonth();

  // ── Profit calculation (seller's 50% share) ───────────────
  const totalProfit = monthEntries.reduce(
    (s, e) =>
      s + (Number(e.harga_jual) - Number(e.harga_beli) - Number(e.biaya_operasional)),
    0
  );
  const sellerShare = monthEntries.reduce(
    (s, e) => s + (typeof (e as Record<string, unknown>)["nominal_komisi"] === "number"
      ? Number((e as Record<string, unknown>)["nominal_komisi"])
      : (Number(e.harga_jual) - Number(e.harga_beli) - Number(e.biaya_operasional)) * 0.5),
    0
  );
  const estimatedBonus = achieved
    ? sellerShare * (config.bonus_percentage / 100)
    : 0;

  // Projected bonus if on track (linear extrapolation)
  const projectedUnits =
    daysLeft < 30 && now.getDate() > 1
      ? Math.round((unitsSold / now.getDate()) * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
      : unitsSold;
  const onTrack = projectedUnits >= targetUnits;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
      <CardContent className="p-5 space-y-4">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Target Bulan Ini</h3>
              <p className="text-[10px] text-muted-foreground">
                {now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          {achieved && (
            <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
              <Award className="w-3.5 h-3.5" />
              Target Tercapai!
            </div>
          )}
        </div>

        {/* ── Progress bar ───────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold font-mono">
              {unitsSold}
              <span className="text-muted-foreground font-normal"> / {targetUnits} unit</span>
            </span>
            <span className={`font-bold text-sm ${achieved ? "text-primary" : "text-muted-foreground"}`}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <ProgressBar pct={pct} />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              {achieved
                ? `Melebihi target ${unitsSold - targetUnits > 0 ? `+${unitsSold - targetUnits} unit` : ""}`
                : `Sisa ${targetUnits - unitsSold} unit lagi`}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {daysLeft} hari tersisa
            </span>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* Profit bulan ini */}
          <div className="rounded-lg bg-muted/50 p-2.5 space-y-0.5">
            <p className="text-[10px] text-muted-foreground">Profit Bulan Ini</p>
            <p className={`text-xs font-bold font-mono ${totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatRp(sellerShare)}
            </p>
            <p className="text-[9px] text-muted-foreground">bagian kamu</p>
          </div>

          {/* Estimasi bonus */}
          <div className={`rounded-lg p-2.5 space-y-0.5 ${achieved ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}>
            <p className="text-[10px] text-muted-foreground">Estimasi Bonus</p>
            <p className={`text-xs font-bold font-mono ${achieved ? "text-primary" : "text-muted-foreground"}`}>
              {achieved ? formatRp(estimatedBonus) : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {config.bonus_percentage}% dari profit
            </p>
          </div>

          {/* Proyeksi */}
          <div className="rounded-lg bg-muted/50 p-2.5 space-y-0.5">
            <p className="text-[10px] text-muted-foreground">Proyeksi Unit</p>
            <p className={`text-xs font-bold font-mono ${onTrack ? "text-primary" : "text-amber-500"}`}>
              {projectedUnits} unit
            </p>
            <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" />
              {onTrack ? "On track" : "Perlu lebih giat"}
            </p>
          </div>
        </div>

        {/* ── Motivational footer ─────────────────────────────── */}
        {!achieved && (
          <p className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border">
            {pct >= 75
              ? "Hampir sampai! Tetap semangat 💪"
              : pct >= 50
              ? "Sudah setengah jalan, jangan berhenti! 🔥"
              : "Mulai dari satu transaksi, terus bergerak! 🚀"}
          </p>
        )}
        {achieved && (
          <p className="text-[10px] text-primary text-center pt-1 border-t border-primary/20 font-medium">
            Luar biasa! Bonus kamu sudah terkunci bulan ini 🎉
          </p>
        )}

      </CardContent>
    </Card>
  );
}
