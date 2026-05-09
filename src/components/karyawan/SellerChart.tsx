import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";

interface ChartData {
  name: string;
  totalUnit: number;
  totalProfit: number;
}

const SellerChart = ({ data }: { data: ChartData[] }) => {
  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-card-foreground">Performa Seller</h2>
        </div>
        {data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Belum ada data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="totalProfit" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} name="Profit" />
              <Bar dataKey="totalUnit" fill="hsl(200, 80%, 55%)" radius={[6, 6, 0, 0]} name="Unit" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerChart;
