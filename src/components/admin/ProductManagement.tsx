import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useProducts,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product,
} from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  PackageSearch,
  Minus,
} from "lucide-react";

// ─── Zod Schema ───────────────────────────────────────────────
const productSchema = z.object({
  nama: z.string().min(1, "Nama produk wajib diisi"),
  merk: z.string().min(1, "Merk wajib diisi"),
  model: z.string().min(1, "Model wajib diisi"),
  kondisi: z.enum(["Baik", "Cukup", "Rusak Ringan"], {
    required_error: "Kondisi wajib dipilih",
  }),
  penyimpanan: z.string().optional(),
  ram: z.string().optional(),
  harga_jual: z.coerce
    .number({ invalid_type_error: "Harga jual harus angka" })
    .positive("Harga jual harus lebih dari 0"),
  harga_beli: z.coerce
    .number({ invalid_type_error: "Harga beli harus angka" })
    .positive("Harga beli harus lebih dari 0"),
  stok: z.coerce
    .number({ invalid_type_error: "Stok harus angka" })
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif"),
  foto_url: z.string().url("URL foto tidak valid").optional().or(z.literal("")),
}).refine((d) => d.harga_jual > d.harga_beli, {
  message: "Harga jual harus lebih besar dari harga beli",
  path: ["harga_jual"],
});

type ProductFormValues = z.infer<typeof productSchema>;

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const KONDISI_COLORS: Record<Product["kondisi"], string> = {
  Baik: "bg-primary/10 text-primary border-primary/20",
  Cukup: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  "Rusak Ringan": "bg-destructive/10 text-destructive border-destructive/20",
};

// ─── Product Form Dialog ──────────────────────────────────────
interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: Product | null;
}

function ProductFormDialog({ open, onOpenChange, editProduct }: ProductFormDialogProps) {
  const { user } = useAuth();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();

  const isEdit = !!editProduct;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nama: editProduct?.nama ?? "",
      merk: editProduct?.merk ?? "",
      model: editProduct?.model ?? "",
      kondisi: editProduct?.kondisi ?? "Baik",
      penyimpanan: editProduct?.penyimpanan ?? "",
      ram: editProduct?.ram ?? "",
      harga_jual: editProduct?.harga_jual ?? 0,
      harga_beli: editProduct?.harga_beli ?? 0,
      stok: editProduct?.stok ?? 0,
      foto_url: editProduct?.foto_url ?? "",
    },
  });

  // Reset form when dialog opens with new data
  const handleOpenChange = (o: boolean) => {
    if (o && editProduct) {
      form.reset({
        nama: editProduct.nama,
        merk: editProduct.merk,
        model: editProduct.model,
        kondisi: editProduct.kondisi,
        penyimpanan: editProduct.penyimpanan ?? "",
        ram: editProduct.ram ?? "",
        harga_jual: editProduct.harga_jual,
        harga_beli: editProduct.harga_beli,
        stok: editProduct.stok,
        foto_url: editProduct.foto_url ?? "",
      });
    } else if (!o) {
      form.reset();
    }
    onOpenChange(o);
  };

  const isPending = addProduct.isPending || updateProduct.isPending;

  const onSubmit = async (values: ProductFormValues) => {
    const base = {
      nama: values.nama,
      merk: values.merk,
      model: values.model,
      kondisi: values.kondisi,
      harga_jual: values.harga_jual,
      harga_beli: values.harga_beli,
      stok: values.stok,
      penyimpanan: values.penyimpanan || null,
      ram: values.ram || null,
      foto_url: values.foto_url || null,
    };

    if (isEdit && editProduct) {
      await updateProduct.mutateAsync({ id: editProduct.id, ...base });
    } else {
      await addProduct.mutateAsync({ ...base, created_by: user?.id ?? null });
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nama */}
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="cth. iPhone 13 Pro 256GB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Merk + Model */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="merk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merk</FormLabel>
                    <FormControl>
                      <Input placeholder="Apple" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="iPhone 13 Pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Kondisi */}
            <FormField
              control={form.control}
              name="kondisi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kondisi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kondisi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Baik">Baik</SelectItem>
                      <SelectItem value="Cukup">Cukup</SelectItem>
                      <SelectItem value="Rusak Ringan">Rusak Ringan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Penyimpanan + RAM */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="penyimpanan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penyimpanan</FormLabel>
                    <FormControl>
                      <Input placeholder="256GB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RAM</FormLabel>
                    <FormControl>
                      <Input placeholder="6GB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Harga Jual + Harga Beli */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="harga_beli"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Beli (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="harga_jual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stok */}
            <FormField
              control={form.control}
              name="stok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stok</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Foto URL */}
            <FormField
              control={form.control}
              name="foto_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Foto (opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Simpan Perubahan" : "Tambah Produk"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stock Adjustment Dialog ──────────────────────────────────
interface StockDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StockAdjustDialog({ product, open, onOpenChange }: StockDialogProps) {
  const [delta, setDelta] = useState(1);
  const updateProduct = useUpdateProduct();

  const handleAdjust = async (mode: "add" | "subtract") => {
    const newStok = mode === "add"
      ? product.stok + delta
      : Math.max(0, product.stok - delta);
    await updateProduct.mutateAsync({ id: product.id, stok: newStok });
    onOpenChange(false);
    setDelta(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Stok — {product.nama}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Stok saat ini: <span className="font-bold text-foreground">{product.stok}</span>
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDelta((d) => Math.max(1, d - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={delta}
              min={1}
              onChange={(e) => setDelta(Math.max(1, Number(e.target.value)))}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDelta((d) => d + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => handleAdjust("subtract")}
            disabled={updateProduct.isPending}
          >
            {updateProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Minus className="mr-1 h-4 w-4" /> Kurangi
          </Button>
          <Button
            onClick={() => handleAdjust("add")}
            disabled={updateProduct.isPending}
          >
            {updateProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-1 h-4 w-4" /> Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ProductManagement Component ────────────────────────
export default function ProductManagement() {
  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Manajemen Produk</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} produk terdaftar
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat produk...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <PackageSearch className="h-10 w-10 opacity-40" />
              <p className="text-sm">Belum ada produk. Klik "Tambah Produk" untuk mulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Produk</TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead>Spesifikasi</TableHead>
                    <TableHead className="text-right font-mono">Harga Beli</TableHead>
                    <TableHead className="text-right font-mono">Harga Jual</TableHead>
                    <TableHead className="text-center">Stok</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const margin = product.harga_jual - product.harga_beli;
                    return (
                      <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                        {/* Produk */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.foto_url ? (
                              <img
                                src={product.foto_url}
                                alt={product.nama}
                                className="h-10 w-10 rounded-lg object-cover border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{product.nama}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.merk} · {product.model}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Kondisi */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${KONDISI_COLORS[product.kondisi]}`}
                          >
                            {product.kondisi}
                          </Badge>
                        </TableCell>

                        {/* Spesifikasi */}
                        <TableCell>
                          <p className="text-xs text-muted-foreground">
                            {[product.penyimpanan, product.ram]
                              .filter(Boolean)
                              .join(" / ") || "—"}
                          </p>
                        </TableCell>

                        {/* Harga Beli */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatRp(product.harga_beli)}
                        </TableCell>

                        {/* Harga Jual */}
                        <TableCell className="text-right">
                          <div>
                            <p className="font-mono text-sm font-semibold text-primary">
                              {formatRp(product.harga_jual)}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              +{formatRp(margin)}
                            </p>
                          </div>
                        </TableCell>

                        {/* Stok */}
                        <TableCell className="text-center">
                          <button
                            onClick={() => setStockProduct(product)}
                            className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md text-sm font-bold font-mono
                              bg-muted hover:bg-muted/80 transition-colors cursor-pointer
                              border border-border"
                            title="Klik untuk update stok"
                          >
                            {product.stok}
                          </button>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setEditProduct(product)}
                              title="Edit produk"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  title="Hapus produk"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Yakin ingin menghapus{" "}
                                    <strong>{product.nama}</strong>? Tindakan ini tidak dapat
                                    dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProduct.mutate(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ────────────────────────────────────────────── */}
      <ProductFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      <ProductFormDialog
        open={!!editProduct}
        onOpenChange={(o) => { if (!o) setEditProduct(null); }}
        editProduct={editProduct}
      />
      {stockProduct && (
        <StockAdjustDialog
          product={stockProduct}
          open={!!stockProduct}
          onOpenChange={(o) => { if (!o) setStockProduct(null); }}
        />
      )}
    </div>
  );
}
