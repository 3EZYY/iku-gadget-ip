import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const JENIS_UNIT_OPTIONS = ["HP", "Laptop", "Tablet", "Aksesoris", "Smartwatch", "Lainnya"];

// ─── Currency input helpers ───────────────────────────────────
/** Strip non-digits and format with thousand separators */
function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

/** Parse formatted string back to plain number string for state */
function parseFormatted(formatted: string): string {
  return formatted.replace(/\./g, "").replace(/,/g, "");
}

interface JournalFormProps {
  onSuccess: () => void;
  editData?: {
    id: string;
    tanggal: string;
    nama_seller: string;
    jenis_unit: string;
    nama_unit: string;
    harga_jual: number;
    harga_beli: number;
    biaya_operasional: number;
    keterangan_biaya: string | null;
  } | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function JournalForm({ onSuccess, editData, open, onOpenChange }: JournalFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [komisiPersen, setKomisiPersen] = useState(50);
  const [form, setForm] = useState({
    tanggal: editData?.tanggal || new Date().toISOString().split("T")[0],
    nama_seller: editData?.nama_seller || "",
    jenis_unit: editData?.jenis_unit || "HP",
    nama_unit: editData?.nama_unit || "",
    harga_jual: editData?.harga_jual ? Number(editData.harga_jual).toLocaleString("id-ID") : "",
    harga_beli: editData?.harga_beli ? Number(editData.harga_beli).toLocaleString("id-ID") : "",
    biaya_operasional: editData?.biaya_operasional ? Number(editData.biaya_operasional).toLocaleString("id-ID") : "0",
    keterangan_biaya: editData?.keterangan_biaya || "",
  });

  // Fetch user's commission percentage
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("profiles")
      .select("komisi_persen")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { komisi_persen: number } | null }) => {
        if (data?.komisi_persen) setKomisiPersen(data.komisi_persen);
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const hargaJual = Number(parseFormatted(form.harga_jual));
    const hargaBeli = Number(parseFormatted(form.harga_beli));
    const biayaOp = Number(parseFormatted(form.biaya_operasional));
    const profitTotal = hargaJual - hargaBeli - biayaOp;
    const nominalKomisi = profitTotal * (komisiPersen / 100);

    const payload = {
      user_id: user.id,
      tanggal: form.tanggal,
      nama_seller: form.nama_seller,
      jenis_unit: form.jenis_unit,
      nama_unit: form.nama_unit,
      harga_jual: hargaJual,
      harga_beli: hargaBeli,
      biaya_operasional: biayaOp,
      keterangan_biaya: form.keterangan_biaya || null,
      komisi_persen_applied: komisiPersen,
      nominal_komisi: nominalKomisi,
    };

    try {
      if (editData) {
        const { error } = await supabase.from("journal").update(payload).eq("id", editData.id);
        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase.from("journal").insert(payload);
        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }
      onSuccess();
      onOpenChange?.(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const profit = Number(parseFormatted(form.harga_jual)) - Number(parseFormatted(form.harga_beli)) - Number(parseFormatted(form.biaya_operasional));
  const profitSeller = profit * (komisiPersen / 100);
  const profitToko = profit - profitSeller;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Nama Seller</Label>
          <Input value={form.nama_seller} onChange={(e) => setForm({ ...form, nama_seller: e.target.value })} placeholder="Nama seller" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jenis Unit</Label>
          <Select value={form.jenis_unit} onValueChange={(v) => setForm({ ...form, jenis_unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {JENIS_UNIT_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nama Unit</Label>
          <Input value={form.nama_unit} onChange={(e) => setForm({ ...form, nama_unit: e.target.value })} placeholder="Nama/model unit" required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Harga Jual</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">Rp</span>
            <Input
              type="text"
              inputMode="numeric"
              value={form.harga_jual}
              onChange={(e) => setForm({ ...form, harga_jual: formatThousands(e.target.value) })}
              placeholder="0"
              className="pl-8 font-mono"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Harga Beli</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">Rp</span>
            <Input
              type="text"
              inputMode="numeric"
              value={form.harga_beli}
              onChange={(e) => setForm({ ...form, harga_beli: formatThousands(e.target.value) })}
              placeholder="0"
              className="pl-8 font-mono"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Biaya Operasional</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">Rp</span>
            <Input
              type="text"
              inputMode="numeric"
              value={form.biaya_operasional}
              onChange={(e) => setForm({ ...form, biaya_operasional: formatThousands(e.target.value) })}
              placeholder="0"
              className="pl-8 font-mono"
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Keterangan Biaya Operasional</Label>
        <Input value={form.keterangan_biaya} onChange={(e) => setForm({ ...form, keterangan_biaya: e.target.value })} placeholder="Karena apa? (opsional)" />
      </div>

      <div className="rounded-lg bg-accent p-3 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Profit:</span> <span className="font-semibold">Rp {profit.toLocaleString("id-ID")}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Profit Seller ({komisiPersen}%):</span> <span>Rp {profitSeller.toLocaleString("id-ID")}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Profit Toko ({100 - komisiPersen}%):</span> <span>Rp {profitToko.toLocaleString("id-ID")}</span></div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Menyimpan..." : editData ? "Perbarui" : "Tambah"}
      </Button>
    </form>
  );

  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editData ? "Edit Jurnal" : "Tambah Jurnal"}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Tambah Jurnal</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Jurnal</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
