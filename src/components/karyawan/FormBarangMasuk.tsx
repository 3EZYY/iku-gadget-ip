import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useAddProduct } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PackagePlus, Loader2 } from "lucide-react";

// ─── Currency helpers ─────────────────────────────────────────
function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}
function parseFormatted(s: string): number {
  return Number(s.replace(/\./g, "").replace(/,/g, "")) || 0;
}

// ─── Schema ───────────────────────────────────────────────────
const schema = z.object({
  nama: z.string().min(1, "Nama produk wajib diisi"),
  merk: z.string().min(1, "Merk wajib diisi"),
  model: z.string().min(1, "Model wajib diisi"),
  kondisi: z.enum(["Baik", "Cukup", "Rusak Ringan"]),
  penyimpanan: z.string().optional(),
  ram: z.string().optional(),
  harga_beli_display: z.string().min(1, "Harga beli wajib diisi"),
  harga_jual_display: z.string().min(1, "Harga jual rencana wajib diisi"),
}).superRefine((d, ctx) => {
  const beli = parseFormatted(d.harga_beli_display);
  const jual = parseFormatted(d.harga_jual_display);
  if (beli <= 0) ctx.addIssue({ code: "custom", path: ["harga_beli_display"], message: "Harga beli harus > 0" });
  if (jual <= 0) ctx.addIssue({ code: "custom", path: ["harga_jual_display"], message: "Harga jual harus > 0" });
  if (jual > 0 && beli > 0 && jual <= beli) {
    ctx.addIssue({ code: "custom", path: ["harga_jual_display"], message: "Harga jual harus > harga beli" });
  }
});

type FormValues = z.infer<typeof schema>;

const RAM_OPTIONS = ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"];
const STORAGE_OPTIONS = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];

// ─── Main Component ───────────────────────────────────────────
export default function FormBarangMasuk() {
  const { user } = useAuth();
  const addProduct = useAddProduct();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama: "", merk: "", model: "", kondisi: "Baik",
      penyimpanan: "", ram: "",
      harga_beli_display: "", harga_jual_display: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    await addProduct.mutateAsync({
      nama: values.nama,
      merk: values.merk,
      model: values.model,
      kondisi: values.kondisi,
      penyimpanan: values.penyimpanan || null,
      ram: values.ram || null,
      harga_beli: parseFormatted(values.harga_beli_display),
      harga_jual: parseFormatted(values.harga_jual_display),
      stok: 1,
      created_by: user?.id ?? null,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <PackagePlus className="h-3.5 w-3.5" />
          Catat Barang Masuk
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Catat Barang Masuk (Beli/Kulakan)
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nama" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Produk</FormLabel>
                <FormControl><Input placeholder="cth. iPhone 13 Pro 256GB Black" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="merk" render={({ field }) => (
                <FormItem>
                  <FormLabel>Merk</FormLabel>
                  <FormControl><Input placeholder="Apple" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl><Input placeholder="iPhone 13 Pro" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="kondisi" render={({ field }) => (
              <FormItem>
                <FormLabel>Kondisi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Baik">Baik</SelectItem>
                    <SelectItem value="Cukup">Cukup</SelectItem>
                    <SelectItem value="Rusak Ringan">Rusak Ringan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="penyimpanan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Penyimpanan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STORAGE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ram" render={({ field }) => (
                <FormItem>
                  <FormLabel>RAM</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {RAM_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="harga_beli_display" render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Beli (Rp)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                      <Input
                        type="text" inputMode="numeric" placeholder="0"
                        className="pl-8 font-mono"
                        value={field.value}
                        onChange={(e) => field.onChange(formatThousands(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="harga_jual_display" render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Jual Rencana (Rp)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                      <Input
                        type="text" inputMode="numeric" placeholder="0"
                        className="pl-8 font-mono"
                        value={field.value}
                        onChange={(e) => field.onChange(formatThousands(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <p className="text-[10px] text-muted-foreground">
              Stok otomatis diset ke 1. Produk akan muncul di katalog Toko.
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={addProduct.isPending}>
                {addProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Barang Masuk
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
