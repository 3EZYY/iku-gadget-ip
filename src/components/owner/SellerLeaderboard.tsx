import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Trophy,
  Medal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface JournalEntry {
  nama_seller: string;
  harga_jual: number | string;
  harga_beli: number | string;
  biaya_operasional: number | string;
}

type SortKey = "transaksi" | "totalJual" | "totalProfit" | "komisi";
type SortDir = "asc" | "desc";

interface SellerStat {
  nama_seller: string;
  transaksi: number;
  totalJual: number;
  totalProfit: number;
  komisi: number;
}

interface SellerLeaderboardProps {
  data: JournalEntry[];
  /** Label shown above the table, e.g. "Bulan Ini" */
  label?: string;
  /** If true, show the top-performer badge on rank #1 */
  showTopBadge?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────
const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function buildStats(data: JournalEntry[]): SellerStat[] {
  const map = new Map<string, SellerStat>();
  data.forEach((r) => {
    const profit =
      Number(r.harga_jual) - Number(r.harga_beli) - Number(r.biaya_operasional);
    const existing = map.get(r.nama_seller) ?? {
      nama_seller: r.nama_seller,
      transaksi: 0,
      totalJual: 0,
      totalProfit: 0,
      komisi: 0,
    };
    existing.transaksi += 1;
    existing.totalJual += Number(r.harga_jual);
    existing.totalProfit += profit;
    existing.komisi += profit / 2;
    map.set(r.nama_seller, existing);
  });
  return Array.from(map.values());
}

function exportCSV(rows: SellerStat[], label: string) {
  const header = ["Rank", "Nama Seller", "Transaksi", "Total Penjualan", "Total Profit", "Komisi Seller"];
  const lines = rows.map((s, i) => [
    i + 1,
    s.nama_seller,
    s.transaksi,
    s.totalJual,
    s.totalProfit,
    s.komisi,
  ]);

  const csv = [header, ...lines]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leaderboard_${label.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sortable column header ───────────────────────────────────
function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors hover:text-foreground ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {label}
      {active ? (
        dir === "desc" ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUp className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

// ─── Rank icon ────────────────────────────────────────────────
function RankIcon({ rank, isTopMonth }: { rank: number; isTopMonth: boolean }) {
  if (rank === 1) {
    return (
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse" />
        <Trophy className="h-5 w-5 text-amber-500" />
        {isTopMonth && (
          <span className="absolute -top-1 -right-1 text-[9px] bg-amber-500 text-white rounded-full px-1 font-bold leading-4">
            #1
          </span>
        )}
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-500/10">
        <Medal className="h-4 w-4 text-slate-400" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
        <Medal className="h-4 w-4 text-orange-400" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-bold">
      {rank}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function SellerLeaderboard({
  data,
  label = "Semua Waktu",
  showTopBadge = false,
}: SellerLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalProfit");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const stats = useMemo(() => buildStats(data), [data]);

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "desc" ? -diff : diff;
    });
  }, [stats, sortKey, sortDir]);

  // Top performer by profit (for badge — always by profit regardless of sort)
  const topPerformerName = useMemo(
    () => stats.sort((a, b) => b.totalProfit - a.totalProfit)[0]?.nama_seller ?? "",
    [stats]
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Belum ada data transaksi.
      </div>
    );
  }

  // Progress bar max value
  const maxProfit = Math.max(...sorted.map((s) => s.totalProfit), 1);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={() => exportCSV(sorted, label)}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* ── Column headers ───────────────────────────────────── */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 pb-1 border-b border-border">
        <span className="text-xs text-muted-foreground">Seller</span>
        <SortHeader label="Transaksi" sortKey="transaksi" current={sortKey} dir={sortDir} onSort={handleSort} />
        <SortHeader label="Penjualan" sortKey="totalJual" current={sortKey} dir={sortDir} onSort={handleSort} />
        <SortHeader label="Profit" sortKey="totalProfit" current={sortKey} dir={sortDir} onSort={handleSort} />
        <SortHeader label="Komisi" sortKey="komisi" current={sortKey} dir={sortDir} onSort={handleSort} />
      </div>

      {/* ── Rows ─────────────────────────────────────────────── */}
      {sorted.map((s, i) => {
        const isTop = showTopBadge && s.nama_seller === topPerformerName;
        const progressPct = maxProfit > 0 ? (s.totalProfit / maxProfit) * 100 : 0;

        return (
          <Card
            key={s.nama_seller}
            className={`overflow-hidden transition-all ${
              isTop
                ? "border-amber-500/40 shadow-[0_0_12px_hsl(45_90%_50%/0.15)]"
                : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                {/* Rank + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <RankIcon rank={i + 1} isTopMonth={isTop} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{s.nama_seller}</p>
                      {isTop && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
                          <Trophy className="h-2.5 w-2.5" /> Top Performer
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.transaksi} transaksi</p>
                  </div>
                </div>

                {/* Stats — desktop */}
                <div className="hidden sm:grid grid-cols-3 gap-6 text-right text-sm shrink-0">
                  <div>
                    <p className="text-xs text-muted-foreground">Penjualan</p>
                    <p className="font-medium font-mono text-xs">{formatRp(s.totalJual)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profit</p>
                    <p className={`font-semibold font-mono text-xs ${s.totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatRp(s.totalProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Komisi</p>
                    <p className="font-medium font-mono text-xs">{formatRp(s.komisi)}</p>
                  </div>
                </div>

                {/* Stats — mobile (compact) */}
                <div className="sm:hidden text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className={`font-semibold font-mono text-sm ${s.totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatRp(s.totalProfit)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    isTop
                      ? "bg-gradient-to-r from-amber-500 to-primary"
                      : "bg-primary/70"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
