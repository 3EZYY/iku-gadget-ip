import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Wallet, ShoppingCart, Users } from "lucide-react";

interface DashboardProps {
  totalProfit: number;
  totalTransactions: number;
  totalSellers: number;
  totalProducts: number;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) => (
  <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300">
    <CardContent className="p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xl font-extrabold text-card-foreground truncate">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = ({
  totalProfit,
  totalTransactions,
  totalSellers,
  totalProducts,
}: DashboardProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Profit — green */}
      <StatCard
        icon={TrendingUp}
        label="Total Profit"
        value={`Rp ${totalProfit.toLocaleString("id-ID")}`}
        iconBg="hsl(160 60% 45% / 0.12)"
        iconColor="hsl(160 60% 40%)"
      />
      {/* Bagian Investor — orange */}
      <StatCard
        icon={Wallet}
        label="Bagian Investor"
        value={`Rp ${(totalProfit * 0.5).toLocaleString("id-ID")}`}
        iconBg="hsl(28 90% 55% / 0.12)"
        iconColor="hsl(28 90% 50%)"
      />
      {/* Transaksi — blue */}
      <StatCard
        icon={ShoppingCart}
        label="Transaksi"
        value={totalTransactions.toString()}
        iconBg="hsl(200 80% 55% / 0.12)"
        iconColor="hsl(200 80% 48%)"
      />
      {/* Seller Aktif — red/pink */}
      <StatCard
        icon={Users}
        label="Seller Aktif"
        value={totalSellers.toString()}
        iconBg="hsl(0 72% 55% / 0.12)"
        iconColor="hsl(0 72% 50%)"
      />
    </div>
  );
};

export default Dashboard;
