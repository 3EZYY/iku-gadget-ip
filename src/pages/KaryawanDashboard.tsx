import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useSellerVisitLogger } from "@/hooks/useSellerVisitLogger";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, ShoppingCart, Store, BarChart3, Sparkles, Smartphone } from "lucide-react";
import logo from "@/assets/logo.png";

// ── Migrated components from Project A ───────────────────────
import DashboardStats from "@/components/karyawan/Dashboard";
import TransactionTable from "@/components/karyawan/TransactionTable";
import SellerChart from "@/components/karyawan/SellerChart";
import PricePrediction from "@/components/karyawan/PricePrediction";
import ImeiChecker from "@/components/karyawan/ImeiChecker";
import OnlineStore from "@/components/karyawan/OnlineStore";
import DarkModeToggle from "@/components/karyawan/DarkModeToggle";
import TargetProgress from "@/components/karyawan/TargetProgress";
import JournalForm from "@/components/JournalForm";

// ─── Types ────────────────────────────────────────────────────
interface JournalEntry {
  id: string;
  tanggal: string;
  nama_seller: string;
  jenis_unit: string;
  nama_unit: string;
  harga_jual: number;
  harga_beli: number;
  biaya_operasional: number;
  keterangan_biaya: string | null;
  user_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────
/** Map a journal entry to the Transaction shape expected by TransactionTable */
function toTransaction(e: JournalEntry) {
  const profit = Number(e.harga_jual) - Number(e.harga_beli) - Number(e.biaya_operasional);
  return {
    id: e.id,
    seller: e.nama_seller,
    unit: 1,
    modal: Number(e.harga_beli),
    jual: Number(e.harga_jual),
    profit,
    investorShare: profit * 0.5,
    sellerShare: profit * 0.5,
    date: new Date(e.tanggal).toLocaleDateString("id-ID"),
  };
}

// ─── Main Component ───────────────────────────────────────────
export default function KaryawanDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Log visit when karyawan opens dashboard
  useSellerVisitLogger();

  // ── Journal entries (own data only — enforced by RLS) ────────
  const { data: entries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["journal", "karyawan", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal")
        .select("*")
        .eq("user_id", user!.id)
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
    enabled: !!user,
  });

  // ── Refresh helper ───────────────────────────────────────────
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["journal", "karyawan", user?.id] });

  // ── Stats ─────────────────────────────────────────────────────
  const totalProfit = entries.reduce(
    (s, r) => s + (Number(r.harga_jual) - Number(r.harga_beli) - Number(r.biaya_operasional)),
    0
  );
  const totalTransactions = entries.length;

  // Unique sellers visible to this karyawan (just themselves)
  const uniqueSellers = [...new Set(entries.map((e) => e.nama_seller))];
  const totalSellers = uniqueSellers.length || 1;

  // Unique product types
  const totalProducts = [...new Set(entries.map((e) => e.jenis_unit))].length;

  // ── Chart data ────────────────────────────────────────────────
  const chartData = uniqueSellers.map((seller) => {
    const sellerEntries = entries.filter((e) => e.nama_seller === seller);
    return {
      name: seller,
      totalUnit: sellerEntries.length,
      totalProfit: sellerEntries.reduce(
        (s, r) => s + (Number(r.harga_jual) - Number(r.harga_beli) - Number(r.biaya_operasional)),
        0
      ),
    };
  });

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Iku Gadget"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight">Iku Gadget</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-semibold">
                PRO
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs hidden sm:flex">
              {user?.email?.split("@")[0]}
            </Badge>
            <DarkModeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* ── Stat Cards ─────────────────────────────────────────── */}
        <DashboardStats
          totalProfit={totalProfit}
          totalTransactions={totalTransactions}
          totalSellers={totalSellers}
          totalProducts={totalProducts}
        />

        {/* ── Target & Bonus Progress ────────────────────────────── */}
        <TargetProgress entries={entries} />

        {/* ── Tab Navigation ─────────────────────────────────────── */}
        <Tabs defaultValue="transaksi">
          <TabsList className="h-auto bg-muted/40 border border-border rounded-xl p-1 flex-wrap gap-0.5 w-fit">
            {(
              [
                { value: "transaksi", icon: ShoppingCart, label: "Transaksi" },
                { value: "toko",      icon: Store,        label: "Toko" },
                { value: "analitik",  icon: BarChart3,    label: "Analitik" },
                { value: "ai",        icon: Sparkles,     label: "AI Prediksi" },
                { value: "imei",      icon: Smartphone,   label: "Cek IMEI" },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="
                  gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg font-medium
                  text-muted-foreground
                  data-[state=active]:bg-primary
                  data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-sm
                  hover:text-foreground
                  transition-all
                "
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Tab: Transaksi ─────────────────────────────────────── */}
          <TabsContent value="transaksi" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Riwayat Transaksi</h2>
              <JournalForm onSuccess={refresh} />
            </div>
            <TransactionTable
              transactions={entries.map(toTransaction)}
              isAdmin={false}
            />
          </TabsContent>

          {/* ── Tab: Toko Online ───────────────────────────────────── */}
          <TabsContent value="toko" className="mt-4">
            <OnlineStore />
          </TabsContent>

          {/* ── Tab: Analitik ──────────────────────────────────────── */}
          <TabsContent value="analitik" className="mt-4">
            <SellerChart data={chartData} />
          </TabsContent>

          {/* ── Tab: AI Prediksi ───────────────────────────────────── */}
          <TabsContent value="ai" className="mt-4">
            <PricePrediction />
          </TabsContent>

          {/* ── Tab: Cek IMEI ──────────────────────────────────────── */}
          <TabsContent value="imei" className="mt-4">
            <ImeiChecker />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
