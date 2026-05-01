import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Settings, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface IncentiveConfig {
  id: string;
  target_units: number;
  bonus_percentage: number;
}

interface SellerStat {
  nama_seller: string;
  unit_count: number;
  total_profit: number;
}

interface IncentivePanelProps {
  data: any[];
  isAdmin: boolean;
}

export default function IncentivePanel({ data, isAdmin }: IncentivePanelProps) {
  const [config, setConfig] = useState<IncentiveConfig | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [editBonus, setEditBonus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data: rows } = await supabase
        .from("incentive_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (rows) {
        setConfig(rows as unknown as IncentiveConfig);
        setEditTarget(String(rows.target_units));
        setEditBonus(String(rows.bonus_percentage));
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from("incentive_config")
      .update({
        target_units: Number(editTarget),
        bonus_percentage: Number(editBonus),
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);
    if (error) {
      toast.error("Gagal menyimpan pengaturan");
    } else {
      setConfig({ ...config, target_units: Number(editTarget), bonus_percentage: Number(editBonus) });
      toast.success("Pengaturan bonus berhasil diperbarui!");
      setDialogOpen(false);
    }
    setSaving(false);
  };

  if (!config) return null;

  // Calculate per-seller stats for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyData = data.filter((r) => {
    const d = new Date(r.tanggal);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const sellerMap = new Map<string, SellerStat>();
  monthlyData.forEach((r) => {
    const existing = sellerMap.get(r.nama_seller) || { nama_seller: r.nama_seller, unit_count: 0, total_profit: 0 };
    existing.unit_count += 1;
    existing.total_profit += Number(r.harga_jual) - Number(r.harga_beli) - Number(r.biaya_operasional);
    sellerMap.set(r.nama_seller, existing);
  });

  const sellers = Array.from(sellerMap.values()).sort((a, b) => b.unit_count - a.unit_count);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Bonus Insentif Bulan Ini</CardTitle>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="mr-1 h-3.5 w-3.5" /> Atur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Pengaturan Bonus Insentif</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Unit / Bulan</Label>
                    <Input
                      type="number"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bonus (% dari Keuntungan Seller)</Label>
                    <Input
                      type="number"
                      value={editBonus}
                      onChange={(e) => setEditBonus(e.target.value)}
                      min={0}
                      max={100}
                      step={0.5}
                    />
                  </div>
                  <Button onClick={handleSave} className="w-full" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Target: <span className="font-semibold text-foreground">{config.target_units} unit</span> — Bonus:{" "}
          <span className="font-semibold text-foreground">{config.bonus_percentage}%</span> dari keuntungan
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {sellers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada transaksi bulan ini.</p>
        ) : (
          sellers.map((s) => {
            const progress = Math.min((s.unit_count / config.target_units) * 100, 100);
            const achieved = s.unit_count >= config.target_units;
            const sellerProfit = s.total_profit / 2; // 50% share
            const bonusAmount = achieved ? sellerProfit * (config.bonus_percentage / 100) : 0;

            return (
              <div key={s.nama_seller} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{s.nama_seller}</span>
                  </div>
                  <span className={`text-xs font-semibold ${achieved ? "text-primary" : "text-muted-foreground"}`}>
                    {s.unit_count}/{config.target_units} unit
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${achieved ? "bg-primary" : "bg-primary/50"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {achieved && (
                  <div className="flex items-center gap-1 text-xs">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span className="text-primary font-semibold">
                      Bonus: Rp {bonusAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
