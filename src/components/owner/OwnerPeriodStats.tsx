import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingBag,
  DollarSign,
  Package,
  Users,
  CalendarDays,
  Printer,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface JournalEntry {
  tanggal: string;
  nama_seller: string;
  jenis_unit: string;
  harga_jual: number | string;
  harga_beli: number | string;
  biaya_operasional: number | string;
}

export type PeriodKey = "today" | "week" | "month" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

interface PeriodStats {
  profit: number;
  profitToko: number;
  transaksi: number;
  unitTerjual: number;
  sellerAktif: number;
}

interface DeltaResult {
  value: number;       // percentage change, e.g. 12.5 means +12.5%
  isPositive: boolean;
  isZero: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────
const formatRp = (n: number) =>
  `Rp ${Math.abs(n).toLocaleString("id-ID")}`;

/** Get start/end Date for a named period relative to `now` */
function getPeriodRange(period: PeriodKey, now: Date, custom?: DateRange): DateRange {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week": {
      const day = now.getDay(); // 0=Sun
      const diffToMon = (day === 0 ? -6 : 1 - day);
      const mon = new Date(now);
      mon.setDate(now.getDate() + diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: startOfDay(mon), to: endOfDay(sun) };
    }
    case "month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case "custom":
      return custom ?? { from: startOfDay(now), to: endOfDay(now) };
  }
}

/** Get the preceding period of the same length */
function getPrevPeriodRange(period: PeriodKey, now: Date, custom?: DateRange): DateRange {
  const curr = getPeriodRange(period, now, custom);
  const lengthMs = curr.to.getTime() - curr.from.getTime();
  return {
    from: new Date(curr.from.getTime() - lengthMs - 1),
    to:   new Date(curr.from.getTime() - 1),
  };
}

function filterByRange(data: JournalEntry[], range: DateRange): JournalEntry[] {
  return data.filter((r) => {
    const d = new Date(r.tanggal);
    return d >= range.from && d <= range.to;
  });
}

function calcStats(data: JournalEntry[]): PeriodStats {
  const profit = data.reduce(
    (s, r) => s + (Number(r.harga_jual) - Number(r.harga_beli) - Number(r.biaya_operasional)),
    0
  );
  return {
    profit,
    profitToko: profit / 2,
    transaksi: data.length,
    unitTerjual: data.length, // 1 entry = 1 unit
    sellerAktif: new Set(data.map((r) => r.nama_seller)).size,
  };
}

/** Safe delta — returns null if prev is 0 (no meaningful comparison) */
function calcDelta(curr: number, prev: number): DeltaResult {
  if (prev === 0) {
    return { value: 0, isPositive: curr >= 0, isZero: true };
  }
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return { value: Math.abs(pct), isPositive: pct >= 0, isZero: pct === 0 };
}

// ─── Delta Badge ──────────────────────────────────────────────
function DeltaBadge({ delta }: { delta: DeltaResult }) {
  if (delta.isZero) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" /> —
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
        delta.isPositive ? "text-primary" : "text-destructive"
      }`}
    >
      {delta.isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {delta.value.toFixed(1)}%
    </span>
  );
}

// ─── Period Selector ──────────────────────────────────────────
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "week",  label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "custom", label: "Kustom" },
];

// ─── Main Component ───────────────────────────────────────────
interface OwnerPeriodStatsProps {
  data: JournalEntry[];
}

export default function OwnerPeriodStats({ data }: OwnerPeriodStatsProps) {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [customTo, setCustomTo] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const printRef = useRef<HTMLDivElement>(null);

  const now = new Date();

  const customRange: DateRange = useMemo(() => ({
    from: new Date(customFrom + "T00:00:00"),
    to:   new Date(customTo   + "T23:59:59"),
  }), [customFrom, customTo]);

  const currRange = useMemo(
    () => getPeriodRange(period, now, customRange),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, customRange]
  );
  const prevRange = useMemo(
    () => getPrevPeriodRange(period, now, customRange),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, customRange]
  );

  const currData = useMemo(() => filterByRange(data, currRange), [data, currRange]);
  const prevData = useMemo(() => filterByRange(data, prevRange), [data, prevRange]);

  const curr = useMemo(() => calcStats(currData), [currData]);
  const prev = useMemo(() => calcStats(prevData), [prevData]);

  const deltas = useMemo(() => ({
    profit:      calcDelta(curr.profitToko,  prev.profitToko),
    transaksi:   calcDelta(curr.transaksi,   prev.transaksi),
    unit:        calcDelta(curr.unitTerjual, prev.unitTerjual),
    seller:      calcDelta(curr.sellerAktif, prev.sellerAktif),
  }), [curr, prev]);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "";

  // ── Print handler ─────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ── Print date range label ────────────────────────────────
  const printRangeLabel = period === "custom"
    ? `${customFrom} — ${customTo}`
    : `${periodLabel} · ${currRange.from.toLocaleDateString("id-ID")} – ${currRange.to.toLocaleDateString("id-ID")}`;

  return (
    <div className="space-y-3">
      {/* ── Period Selector + Export ──────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border no-print">
          {PERIODS.map(({ key, label }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setPeriod(key)}
              className={`h-7 px-3 text-xs rounded-md transition-all ${
                period === key
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Custom date inputs */}
        {period === "custom" && (
          <div className="flex items-center gap-2 no-print">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-7 w-36 text-xs"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <Input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-7 w-36 text-xs"
            />
          </div>
        )}

        <span className="text-xs text-muted-foreground hidden sm:block no-print">
          vs. periode sebelumnya
        </span>

        {/* Export PDF button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="ml-auto gap-1.5 h-7 text-xs no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          Export PDF
        </Button>
      </div>

      {/* ── Printable area ───────────────────────────────────── */}
      <div ref={printRef} className="print-area space-y-3">

        {/* Print header — only visible when printing */}
        <div className="hidden print:block mb-4">
          <h1 className="text-xl font-bold">Iku Gadget & Stuff — Laporan Profit</h1>
          <p className="text-sm text-gray-500">{printRangeLabel}</p>
          <p className="text-xs text-gray-400">
            Dicetak: {new Date().toLocaleString("id-ID")}
          </p>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Profit Toko */}
          <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-white to-amber-50 dark:border-amber-800/40 dark:from-amber-950/20 dark:to-card">
            <CardContent className="p-4 relative">
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-amber-500/10" />
              <div className="flex items-start justify-between mb-2">
                <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                </div>
                <span className="no-print"><DeltaBadge delta={deltas.profit} /></span>
              </div>
              <p className="text-xs text-muted-foreground">Profit Toko (50%)</p>
              <p className={`text-xl font-bold font-mono mt-0.5 ${curr.profitToko >= 0 ? "text-amber-500" : "text-destructive"}`}>
                {curr.profitToko < 0 ? "-" : ""}{formatRp(curr.profitToko)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{periodLabel}</p>
            </CardContent>
          </Card>

          {/* Total Transaksi */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-primary/5" />
              <div className="flex items-start justify-between mb-2">
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <span className="no-print"><DeltaBadge delta={deltas.transaksi} /></span>
              </div>
              <p className="text-xs text-muted-foreground">Total Transaksi</p>
              <p className="text-xl font-bold font-mono mt-0.5">{curr.transaksi}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{periodLabel}</p>
            </CardContent>
          </Card>

          {/* Unit Terjual */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-primary/5" />
              <div className="flex items-start justify-between mb-2">
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <span className="no-print"><DeltaBadge delta={deltas.unit} /></span>
              </div>
              <p className="text-xs text-muted-foreground">Unit Terjual</p>
              <p className="text-xl font-bold font-mono mt-0.5">{curr.unitTerjual}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{periodLabel}</p>
            </CardContent>
          </Card>

          {/* Seller Aktif */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-primary/5" />
              <div className="flex items-start justify-between mb-2">
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="no-print"><DeltaBadge delta={deltas.seller} /></span>
              </div>
              <p className="text-xs text-muted-foreground">Seller Aktif</p>
              <p className="text-xl font-bold font-mono mt-0.5">{curr.sellerAktif}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{periodLabel}</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Profit breakdown row ──────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Total Penjualan</p>
                <p className="text-sm font-bold font-mono truncate">
                  {formatRp(currData.reduce((s, r) => s + Number(r.harga_jual), 0))}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Total Modal</p>
                <p className="text-sm font-bold font-mono truncate">
                  {formatRp(currData.reduce((s, r) => s + Number(r.harga_beli), 0))}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Profit Kotor</p>
                <p className={`text-sm font-bold font-mono truncate ${curr.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                  {curr.profit < 0 ? "-" : ""}{formatRp(curr.profit)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>{/* end print-area */}
    </div>
  );
}
