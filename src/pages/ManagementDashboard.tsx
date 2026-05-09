import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useSellerVisitLogger } from "@/hooks/useSellerVisitLogger";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import JournalFilters from "@/components/JournalFilters";
import JournalForm from "@/components/JournalForm";
import JournalTable from "@/components/JournalTable";
import WeeklySalesChart from "@/components/WeeklySalesChart";
import NotificationBell from "@/components/NotificationBell";
import MotivationalQuote from "@/components/MotivationalQuote";
import IncentivePanel from "@/components/IncentivePanel";
import UserManagement from "@/components/UserManagement";
import ProductManagement from "@/components/admin/ProductManagement";
import OwnerPeriodStats from "@/components/owner/OwnerPeriodStats";
import SellerLeaderboard from "@/components/owner/SellerLeaderboard";
import SellerProfitChart from "@/components/owner/SellerProfitChart";
import MonthlyTrendChart from "@/components/owner/MonthlyTrendChart";
import DarkModeToggle from "@/components/karyawan/DarkModeToggle";
import {
  LogOut, TrendingUp, ShoppingBag, DollarSign,
  Wallet, Crown, Shield, Users, Settings, Package, BarChart3,
} from "lucide-react";
import logo from "@/assets/logo.png";

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

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

// ─── Main Component ───────────────────────────────────────────
export default function ManagementDashboard() {
  const { user } = useAuth();
  const { role, isOwner } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filteredData, setFilteredData] = useState<JournalEntry[]>([]);
  const [editData, setEditData] = useState<JournalEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Karyawan visit logger — only fires for karyawan, safe to call here too
  useSellerVisitLogger();

  const queryKey = ["journal", "management"];

  const { data: allData = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal")
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
  });

  const handleFiltered = useCallback((filtered: JournalEntry[]) => {
    setFilteredData(filtered);
  }, []);

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditData(entry);
    setEditOpen(true);
  };

  // ── Stats (admin view only — owner uses OwnerPeriodStats) ───
  const totalJual  = allData.reduce((s, r) => s + Number(r.harga_jual), 0);
  const totalBeli  = allData.reduce((s, r) => s + Number(r.harga_beli), 0);
  const totalOp    = allData.reduce((s, r) => s + Number(r.biaya_operasional), 0);
  const totalProfit = totalJual - totalBeli - totalOp;

  const now = new Date();
  const thisMonth = allData.filter((r) => {
    const d = new Date(r.tanggal);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // ── Role badge ───────────────────────────────────────────────
  const roleBadge = isOwner ? (
    <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 hover:bg-amber-500">
      <Crown className="mr-1 h-2.5 w-2.5" /> owner
    </Badge>
  ) : (
    <Badge variant="default" className="text-[10px] px-1.5 py-0">
      <Shield className="mr-1 h-2.5 w-2.5" /> admin
    </Badge>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Iku Gadget & Stuff" width={48} height={48} className="rounded-xl shadow-md" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Iku Gadget & Stuff</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {roleBadge}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <DarkModeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <MotivationalQuote />

        {/* ── Owner: Period-filtered stats with delta ──────────── */}
        {isOwner && <OwnerPeriodStats data={allData} />}

        {/* ── Admin: Simple summary cards (no period filter) ───── */}
        {!isOwner && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4 relative">
                <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-primary/5" />
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2.5">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Transaksi</p>
                  <p className="text-2xl font-bold">{allData.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4 relative">
                <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-primary/5" />
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2.5">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Penjualan</p>
                  <p className="text-lg font-bold">{formatRp(totalJual)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4 relative">
                <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-destructive/5" />
                <div className="rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 p-2.5">
                  <Wallet className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Biaya Op.</p>
                  <p className="text-lg font-bold">{formatRp(totalOp)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4 relative">
                <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-primary/5" />
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Profit</p>
                  <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatRp(totalProfit)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Chart + Incentive ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <WeeklySalesChart data={allData} />
          </div>
          <div>
            {/* Owner can edit incentive config, admin can too */}
            <IncentivePanel data={allData} isAdmin={true} />
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <Tabs defaultValue="transactions">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="transactions">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Jurnal Penjualan
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="sellers">
                <Users className="mr-2 h-4 w-4" />
                Performa Seller
              </TabsTrigger>
            )}
            {isOwner && (
              <TabsTrigger value="analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analitik
              </TabsTrigger>
            )}
            <TabsTrigger value="products">
              <Package className="mr-2 h-4 w-4" />
              Stok Produk
            </TabsTrigger>
            <TabsTrigger value="users">
              <Settings className="mr-2 h-4 w-4" />
              Kelola Pengguna
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Transactions ─────────────────────────────── */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Jurnal Penjualan</h2>
              <JournalForm onSuccess={refresh} />
            </div>
            <JournalFilters data={allData} onFiltered={handleFiltered} />
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
            ) : (
              <JournalTable
                data={filteredData.length > 0 || allData.length === 0 ? filteredData : allData}
                onRefresh={refresh}
                onEdit={handleEdit}
                isAdmin={true}
              />
            )}
            <JournalForm
              onSuccess={refresh}
              editData={editData}
              open={editOpen}
              onOpenChange={(o) => { setEditOpen(o); if (!o) setEditData(null); }}
            />
          </TabsContent>

          {/* ── Tab: Seller Performance (owner only) ──────────── */}
          {isOwner && (
            <TabsContent value="sellers" className="space-y-6">
              <h2 className="text-xl font-bold">Performa Seller</h2>
              <div>
                <SellerLeaderboard
                  data={allData}
                  label="Semua Waktu"
                  showTopBadge={false}
                />
              </div>
              <div>
                <SellerLeaderboard
                  data={thisMonth}
                  label={`Bulan Ini — ${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`}
                  showTopBadge={true}
                />
              </div>
            </TabsContent>
          )}

          {/* ── Tab: Analytics (owner only) ───────────────────── */}
          {isOwner && (
            <TabsContent value="analytics" className="space-y-4">
              <h2 className="text-xl font-bold">Analitik Lanjutan</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MonthlyTrendChart data={allData} />
                <SellerProfitChart data={allData} />
              </div>
            </TabsContent>
          )}

          {/* ── Tab: Product Management ───────────────────────── */}
          <TabsContent value="products" className="space-y-4">
            <ProductManagement />
          </TabsContent>

          {/* ── Tab: User Management ──────────────────────────── */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-bold">Kelola Pengguna</h2>
            {/* Owner can create admin+karyawan, admin can only create karyawan */}
            <UserManagement callerRole={isOwner ? "owner" : "admin"} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
