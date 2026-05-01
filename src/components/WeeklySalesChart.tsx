import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface JournalEntry {
  tanggal: string;
  harga_jual: number;
  harga_beli: number;
  biaya_operasional: number;
}

interface WeeklySalesChartProps {
  data: JournalEntry[];
}

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  const week = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  return `W${week}`;
}

function getWeekRange(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

const chartConfig = {
  penjualan: { label: "Penjualan", color: "hsl(var(--primary))" },
  profit: { label: "Profit", color: "hsl(142, 71%, 45%)" },
};

export default function WeeklySalesChart({ data }: WeeklySalesChartProps) {
  const weeklyData = useMemo(() => {
    const map = new Map<string, { penjualan: number; profit: number; label: string }>();

    const sorted = [...data].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    sorted.forEach((entry) => {
      const week = getWeekLabel(entry.tanggal);
      const existing = map.get(week) || { penjualan: 0, profit: 0, label: "" };
      existing.penjualan += Number(entry.harga_jual);
      existing.profit += Number(entry.harga_jual) - Number(entry.harga_beli) - Number(entry.biaya_operasional);
      existing.label = getWeekRange(entry.tanggal);
      map.set(week, existing);
    });

    return Array.from(map.entries())
      .slice(-8)
      .map(([week, val]) => ({
        week,
        ...val,
      }));
  }, [data]);

  if (weeklyData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Grafik Penjualan Mingguan</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="week" className="text-xs" />
            <YAxis
              tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
              className="text-xs"
              width={50}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.label) return payload[0].payload.label;
                    return "";
                  }}
                  formatter={(value, name) => {
                    const label = name === "penjualan" ? "Penjualan" : "Profit";
                    return (
                      <span>
                        {label}: <strong>Rp {Number(value).toLocaleString("id-ID")}</strong>
                      </span>
                    );
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="penjualan"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="hsl(142, 71%, 45%)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
