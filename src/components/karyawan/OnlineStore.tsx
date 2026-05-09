import { useProducts, type Product } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  ShoppingBag,
  Package,
  PackageSearch,
  RefreshCw,
} from "lucide-react";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const KONDISI_COLORS: Record<Product["kondisi"], string> = {
  Baik: "bg-primary/10 text-primary border-primary/20",
  Cukup: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  "Rusak Ringan": "bg-destructive/10 text-destructive border-destructive/20",
};

// ─── WhatsApp message builder ─────────────────────────────────
function buildWaMessage(product: Product): string {
  const lines = [
    `Halo, saya tertarik dengan produk berikut:`,
    ``,
    `📱 *${product.nama}*`,
    `Merk/Model : ${product.merk} ${product.model}`,
    `Kondisi    : ${product.kondisi}`,
    product.penyimpanan ? `Storage    : ${product.penyimpanan}` : null,
    product.ram ? `RAM        : ${product.ram}` : null,
    `Harga      : ${formatRp(product.harga_jual)}`,
    ``,
    `Apakah masih tersedia? Terima kasih 🙏`,
  ].filter((l) => l !== null);

  return encodeURIComponent(lines.join("\n"));
}

// ─── Skeleton loader ──────────────────────────────────────────
function ProductSkeleton() {
  return (
    <Card className="border">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function OnlineStore() {
  const { data: products = [], isLoading, isError, refetch } = useProducts();

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-card-foreground">Katalog Produk</h2>
              <p className="text-xs text-muted-foreground">
                Tawarkan produk ke customer via WhatsApp
              </p>
            </div>
          </div>
          {!isLoading && (
            <Badge variant="secondary" className="text-xs">
              {products.length} produk
            </Badge>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <PackageSearch className="h-10 w-10 opacity-40" />
            <p className="text-sm">Gagal memuat produk.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Package className="h-10 w-10 opacity-40" />
            <p className="text-sm">Belum ada produk tersedia.</p>
            <p className="text-xs opacity-70">
              Admin akan menambahkan produk ke katalog.
            </p>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && !isError && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="border shadow-sm hover:shadow-md transition-all group overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Product image */}
                  {product.foto_url ? (
                    <img
                      src={product.foto_url}
                      alt={product.nama}
                      className="w-full h-36 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-36 bg-muted flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    {/* Name + kondisi */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-card-foreground leading-tight">
                        {product.nama}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {product.merk} · {product.model}
                      </p>
                    </div>

                    {/* Specs row */}
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${KONDISI_COLORS[product.kondisi]}`}
                      >
                        {product.kondisi}
                      </Badge>
                      {product.penyimpanan && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {product.penyimpanan}
                        </Badge>
                      )}
                      {product.ram && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {product.ram}
                        </Badge>
                      )}
                    </div>

                    {/* Price + stok */}
                    <div className="flex items-end justify-between">
                      <p className="text-primary font-bold text-base font-mono">
                        {formatRp(product.harga_jual)}
                      </p>
                      <span
                        className={`text-xs font-medium ${
                          product.stok > 0
                            ? "text-primary"
                            : "text-destructive"
                        }`}
                      >
                        {product.stok > 0 ? `Stok: ${product.stok}` : "Habis"}
                      </span>
                    </div>

                    {/* WhatsApp CTA */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 border-primary/30 hover:bg-primary/10 hover:border-primary/60 transition-colors"
                      disabled={product.stok === 0}
                      onClick={() =>
                        window.open(
                          `https://wa.me/?text=${buildWaMessage(product)}`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <MessageCircle className="w-4 h-4" />
                      {product.stok > 0 ? "Tawarkan via WhatsApp" : "Stok Habis"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
