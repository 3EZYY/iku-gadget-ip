import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Prediction {
  estimatedBuyPrice: number;
  estimatedSellPrice: number;
  estimatedProfit: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  tips: string[];
}

const PricePrediction = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    ram: "",
    storage: "",
    batteryHealth: "",
    condition: "Mulus 90%",
  });

  const handlePredict = async () => {
    if (!form.brand || !form.model) {
      toast({
        title: "Lengkapi data",
        description: "Merek dan model wajib diisi",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("predict-price", {
        body: {
          brand: form.brand,
          model: form.model,
          year: form.year ? Number(form.year) : undefined,
          ram: form.ram ? Number(form.ram) : undefined,
          storage: form.storage ? Number(form.storage) : undefined,
          batteryHealth: form.batteryHealth
            ? Number(form.batteryHealth)
            : undefined,
          condition: form.condition,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as Prediction);
    } catch (e) {
      toast({
        title: "Gagal prediksi",
        description: e instanceof Error ? e.message : "Coba lagi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

  const confidenceColor = {
    low: "bg-destructive/10 text-destructive",
    medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    high: "bg-green-500/10 text-green-600 dark:text-green-400",
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              AI Prediksi Harga
            </h2>
            <p className="text-xs text-muted-foreground">
              Estimasi harga beli & jual gadget bekas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Merek *</Label>
            <Input
              placeholder="Contoh: iPhone, Samsung, Asus"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Model *</Label>
            <Input
              placeholder="Contoh: 13 Pro, S22, ROG G14"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tahun Rilis</Label>
            <Input
              type="number"
              placeholder="2022"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">RAM (GB)</Label>
            <Input
              type="number"
              placeholder="8"
              value={form.ram}
              onChange={(e) => setForm({ ...form, ram: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Storage (GB)</Label>
            <Input
              type="number"
              placeholder="256"
              value={form.storage}
              onChange={(e) => setForm({ ...form, storage: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Kesehatan Baterai (%)</Label>
            <Input
              type="number"
              placeholder="85"
              value={form.batteryHealth}
              onChange={(e) =>
                setForm({ ...form, batteryHealth: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Kondisi Fisik</Label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            >
              <option>Like New 99%</option>
              <option>Mulus 90%</option>
              <option>Normal 80%</option>
              <option>Lecet ringan 70%</option>
              <option>Banyak lecet / minus</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handlePredict}
          disabled={loading}
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Menganalisa...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Prediksi Harga Sekarang
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Harga Beli</p>
                <p className="text-lg font-bold text-card-foreground">
                  {fmt(result.estimatedBuyPrice)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Harga Jual</p>
                <p className="text-lg font-bold text-primary">
                  {fmt(result.estimatedSellPrice)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Estimasi Profit
                </p>
                <p className="text-lg font-bold text-primary">
                  {fmt(result.estimatedProfit)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge className={confidenceColor[result.confidence]}>
                Confidence: {result.confidence}
              </Badge>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
              <p className="text-sm text-card-foreground">{result.reasoning}</p>
            </div>

            {result.tips?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-card-foreground flex items-center gap-1">
                  <Lightbulb className="w-4 h-4 text-yellow-500" /> Tips Negosiasi
                </p>
                <ul className="space-y-1.5">
                  {result.tips.map((t, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex gap-2"
                    >
                      <span className="text-primary">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricePrediction;
