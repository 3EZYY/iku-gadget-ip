import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface JournalEntry {
  tanggal: string;
  harga_jual: number | string;
  harga_beli: number | string;
  biaya_operasional: number | string;
}

interface MonthlyTrendChartProps {
  data: JournalEntry[];
}

// ─── Custom dark tooltip ──────────────────────────────────────
interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted-foreground flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-bold text-foreground">
            Rp {p.value.toLocaleString("id-ID")}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Month label helpers ──────────────────────────────────────
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [, m] = key.split("-");
  return MONTH_SHORT[parseInt(m, 10) - 1];
}

// ─── Main Component ───────────────────────────────────────────
export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const chartData = useMemo(() => {
    // Build last 6 calendar months (including current)
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(d));
    }

    const map = new Map<string, { penjualan: number; profit: number }>(
      months.map((m) => [m, { penjualan: 0, profit: 0 }])
    );

    data.forEach((r) => {
      const key = monthKey(new Date(r.tanggal));
      if (!map.has(key)) return; // outside 6-month window
      const existing = map.get(key)!;
      existing.penjualan += Number(r.harga_jual);
      existing.profit +=
        Number(r.harga_jual) - Number(r.harga_beli) - Number(r.biaya_operasional);
    });

    return months.map((key) => ({
      bulan: monthLabel(key),
      ...map.get(key)!,
    }));
  }, [data]);

  const hasData = chartData.some((d) => d.penjualan > 0 || d.profit > 0);
  if (!hasData) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tren 6 Bulan Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
          >
            <defs>
              {/* Penjualan gradient — chart-unit blue */}
              <linearGradient id="gradPenjualan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(200 90% 55%)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(200 90% 55%)" stopOpacity={0.02} />
              </linearGradient>
              {/* Profit gradient — brand-primary green */}
              <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(160 70% 45%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(160 70% 45%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 20%)" />
            <XAxis
              dataKey="bulan"
              tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
              tick={{ fontSize: 10, fill: "hsl(215 20% 65%)" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) =>
                value === "penjualan" ? "Penjualan" : "Profit"
              }
            />

            <Area
              type="monotone"
              dataKey="penjualan"
              name="penjualan"
              stroke="hsl(200 90% 55%)"
              strokeWidth={2}
              fill="url(#gradPenjualan)"
              dot={{ r: 3, fill: "hsl(200 90% 55%)" }}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="profit"
              stroke="hsl(160 70% 45%)"
              strokeWidth={2}
              fill="url(#gradProfit)"
              dot={{ r: 3, fill: "hsl(160 70% 45%)" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
