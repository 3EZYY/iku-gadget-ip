import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, XCircle, AlertTriangle, Loader2, Smartphone, Copy, Palette, HardDrive, Cpu, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DeviceInfo {
  brand: string;
  model: string;
  year?: number;
  possibleColors?: string[];
  storageOptions?: string[];
  ramOptions?: string[];
  category?: string;
  confidence?: "high" | "medium" | "low";
  source?: string;
  notes?: string;
}

interface ImeiResult {
  imei: string;
  valid: boolean;
  tac: string;
  serial: string;
  checkDigit: string;
  computedCheckDigit: number;
  device?: DeviceInfo;
}

const luhnCheck = (imei: string): { valid: boolean; computed: number } => {
  const digits = imei.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = digits[i];
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const computed = (10 - (sum % 10)) % 10;
  return { valid: computed === digits[14], computed };
};

const ImeiChecker = () => {
  const [imei, setImei] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [result, setResult] = useState<ImeiResult | null>(null);

  const handleCheck = async () => {
    const clean = imei.replace(/\D/g, "");
    if (clean.length !== 15) {
      toast.error("IMEI harus 15 digit angka");
      return;
    }
    setLoading(true);
    setResult(null);

    const { valid, computed } = luhnCheck(clean);
    const tac = clean.substring(0, 8);
    const baseResult: ImeiResult = {
      imei: clean,
      valid,
      tac,
      serial: clean.substring(8, 14),
      checkDigit: clean.substring(14, 15),
      computedCheckDigit: computed,
    };

    setResult(baseResult);
    setLoading(false);

    if (!valid) {
      toast.error("IMEI tidak valid (gagal Luhn check)");
      return;
    }

    toast.success("IMEI valid — mencari info perangkat...");
    setLookupLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-imei", { body: { imei: clean } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ ...baseResult, device: data });
    } catch (e) {
      toast.error("Gagal lookup perangkat", { description: (e as Error).message });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin");
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="w-5 h-5 text-primary" />
            Cek IMEI Gadget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imei">Nomor IMEI (15 digit)</Label>
            <div className="flex gap-2">
              <Input
                id="imei"
                placeholder="Contoh: 353281234567890"
                value={imei}
                onChange={(e) => setImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
                maxLength={15}
                className="font-mono"
              />
              <Button onClick={handleCheck} disabled={loading || imei.length !== 15} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Cek
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tekan *#06# di gadget untuk lihat IMEI. Validasi Luhn + AI lookup tipe & warna.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
            <p className="font-semibold text-foreground">⚠️ Cara cek lebih lanjut:</p>
            <p className="text-muted-foreground">• <span className="font-medium">Resmi Kemenperin:</span> imei.kemenperin.go.id</p>
            <p className="text-muted-foreground">• <span className="font-medium">iPhone:</span> checkcoverage.apple.com</p>
            <p className="text-muted-foreground">• <span className="font-medium">Samsung:</span> samsung.com/id/support/check-imei</p>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className={`border-0 shadow-md ${result.valid ? "ring-2 ring-primary/30" : "ring-2 ring-destructive/30"}`}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-primary" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-7 h-7 text-destructive" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg text-card-foreground">
                    {result.valid ? "IMEI Valid" : "IMEI Tidak Valid"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.valid ? "Lulus algoritma Luhn (GSMA)" : `Check digit seharusnya ${result.computedCheckDigit}, bukan ${result.checkDigit}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleCopy(result.imei)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">TAC</p>
                <p className="font-mono font-semibold text-card-foreground">{result.tac}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Serial</p>
                <p className="font-mono font-semibold text-card-foreground">{result.serial}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Check Digit</p>
                <p className="font-mono font-semibold text-card-foreground">{result.checkDigit}</p>
              </div>
            </div>

            {/* Device info from AI */}
            {result.valid && (
              <div className="pt-3 border-t border-border">
                {lookupLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mencari info perangkat di database resmi...
                  </div>
                ) : result.device ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <p className="text-xs text-muted-foreground">
                            {result.device.source === "Kemenperin RI" ? "✅ Data resmi Kemenperin RI" : "⚠️ Estimasi AI (bisa kurang akurat)"}
                          </p>
                        </div>
                        <p className="font-bold text-lg text-card-foreground mt-1">
                          {result.device.brand} {result.device.model}
                        </p>
                      </div>
                      {result.device.confidence && (
                        <Badge variant={result.device.confidence === "high" ? "default" : "secondary"} className="capitalize shrink-0">
                          {result.device.confidence}
                        </Badge>
                      )}
                    </div>

                    {result.device.notes && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                        {result.device.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {result.device.year && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Calendar className="w-3.5 h-3.5" /> Tahun rilis
                          </div>
                          <p className="font-semibold text-card-foreground">{result.device.year}</p>
                        </div>
                      )}
                      {result.device.category && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Smartphone className="w-3.5 h-3.5" /> Kategori
                          </div>
                          <p className="font-semibold text-card-foreground capitalize">{result.device.category}</p>
                        </div>
                      )}
                    </div>

                    {result.device.possibleColors && result.device.possibleColors.length > 0 && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <Palette className="w-3.5 h-3.5" /> Variasi warna resmi
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.device.possibleColors.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.device.storageOptions && result.device.storageOptions.length > 0 && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <HardDrive className="w-3.5 h-3.5" /> Storage tersedia
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.device.storageOptions.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.device.ramOptions && result.device.ramOptions.length > 0 && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <Cpu className="w-3.5 h-3.5" /> RAM tersedia
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.device.ramOptions.map((r) => (
                            <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        TAC hanya menunjukkan model — <span className="font-semibold text-foreground">warna spesifik unit</span> tidak bisa diketahui dari IMEI. Daftar di atas adalah varian resmi yang tersedia. Untuk konfirmasi: cek fisik atau sistem (Settings → About).
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImeiChecker;
