import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Star, CheckCircle2, XCircle, Loader2, MessageSquare, Upload, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────
interface Testimonial {
  id: string;
  nama: string;
  rating: number;
  ulasan: string;
  status: string;
  foto_url: string | null;
  created_at: string;
}

// ─── Approve Dialog with optional photo upload ────────────────
function ApproveDialog({
  testimonial,
  open,
  onOpenChange,
  onApproved,
}: {
  testimonial: Testimonial;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onApproved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }
    if (!f.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleApprove = async () => {
    setLoading(true);
    let fotoUrl: string | null = null;

    try {
      // Upload photo if provided
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${testimonial.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("testimonials")
          .upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("testimonials")
          .getPublicUrl(path);
        fotoUrl = urlData.publicUrl;
      }

      // Update testimonial status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("testimonials")
        .update({
          status: "approved",
          ...(fotoUrl ? { foto_url: fotoUrl } : {}),
        })
        .eq("id", testimonial.id);

      if (error) throw error;

      toast.success("Ulasan disetujui dan dipublikasikan!");
      onOpenChange(false);
      onApproved();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyetujui ulasan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Setujui Ulasan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preview ulasan */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{testimonial.nama}</p>
              <div className="flex gap-0.5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              "{testimonial.ulasan}"
            </p>
          </div>

          {/* Optional photo upload */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Foto Transaksi (opsional)
            </p>
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="mx-auto max-h-32 rounded-lg object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <p className="text-xs">Klik untuk upload foto (maks 5MB)</p>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Setujui & Publikasikan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function TestimonialModeration() {
  const queryClient = useQueryClient();
  const [approveTarget, setApproveTarget] = useState<Testimonial | null>(null);

  // Fetch ALL testimonials (admin can see all statuses via RLS)
  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["testimonials-admin"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("testimonials")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials-admin"] });
      toast.success("Ulasan ditolak");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = testimonials.filter((t) => t.status === "pending");
  const approved = testimonials.filter((t) => t.status === "approved");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["testimonials-admin"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Moderasi Ulasan</h2>
          <p className="text-sm text-muted-foreground">
            {pending.length} menunggu persetujuan · {approved.length} dipublikasikan
          </p>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-amber-500 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Menunggu Persetujuan ({pending.length})
          </h3>
          {pending.map((t) => (
            <Card key={t.id} className="border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{t.nama}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">"{t.ulasan}"</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => setApproveTarget(t)}
                    >
                      <CheckCircle2 className="h-3 w-3" /> Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => rejectMutation.mutate(t.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Dipublikasikan ({approved.length})
          </h3>
          {approved.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {t.foto_url && (
                    <img
                      src={t.foto_url}
                      alt={`Foto transaksi ${t.nama}`}
                      className="h-12 w-12 rounded-lg object-cover border shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{t.nama}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <Badge variant="outline" className="text-[9px] text-primary border-primary/30">
                        Live
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">"{t.ulasan}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Memuat ulasan...
        </div>
      )}
      {!isLoading && testimonials.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada ulasan masuk.</p>
        </div>
      )}

      {/* Approve dialog */}
      {approveTarget && (
        <ApproveDialog
          testimonial={approveTarget}
          open={!!approveTarget}
          onOpenChange={(o) => { if (!o) setApproveTarget(null); }}
          onApproved={refresh}
        />
      )}
    </div>
  );
}
