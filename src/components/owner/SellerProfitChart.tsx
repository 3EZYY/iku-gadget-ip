import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface JournalEntry {
  nama_seller: string;
  harga_jual: number | string;
  harga_beli: number | string;
  biaya_operasional: number | string;
}

interface SellerProfitChartProps {
  data: JournalEntry[];
}

// ─── Custom dark tooltip ──────────────────────────────────────
interface TooltipPayload {
  value: number;
  payload: { seller: string; profit: number; komisi: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{d.seller}</p>
      <p className="text-muted-foreground">
        Profit:{" "}
        <span className="font-mono font-bold text-primary">
          Rp {d.profit.toLocaleString("id-ID")}
        </span>
      </p>
      <p className="text-muted-foreground">
        Komisi:{" "}
        <span className="font-mono text-foreground">
          Rp {d.komisi.toLocaleString("id-ID")}
        </span>
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function SellerProfitChart({ data }: SellerProfitChartProps) {
  const chartData = useMemo(() => {
    const map = new Map<string, { profit: number; komisi: number }>();
    data.forEach((r) => {
      const profit =
        Number(r.harga_jual) - Number(r.harga_beli) - Number(r.biaya_operasional);
      const existing = map.get(r.nama_seller) ?? { profit: 0, komisi: 0 };
      existing.profit += profit;
      existing.komisi += profit / 2;
      map.set(r.nama_seller, existing);
    });

    return Array.from(map.entries())
      .map(([seller, v]) => ({ seller, ...v }))
      .sort((a, b) => b.profit - a.profit);
  }, [data]);

  if (chartData.length === 0) return null;

  // Colour gradient: top seller gets brand-primary, rest fade
  const maxProfit = chartData[0]?.profit ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribusi Profit per Seller</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 44)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="hsl(215 30% 20%)"
            />
            <XAxis
              type="number"
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`}
              tick={{ fontSize: 10, fill: "hsl(215 20% 65%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="seller"
              width={90}
              tick={{ fontSize: 11, fill: "hsl(210 40% 95%)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(222 35% 14%)" }} />
            <Bar dataKey="profit" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {chartData.map((entry) => {
                const ratio = maxProfit > 0 ? entry.profit / maxProfit : 0;
                // Interpolate: top = brand-primary (160 70% 45%), bottom = chart-unit (200 90% 55%)
                const opacity = 0.45 + ratio * 0.55;
                return (
                  <Cell
                    key={entry.seller}
                    fill={`hsl(160 70% 45% / ${opacity})`}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
