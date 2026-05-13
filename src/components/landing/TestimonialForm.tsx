import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Star, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

// ─── Zod Schema ───────────────────────────────────────────────
const testimonialSchema = z.object({
  nama: z.string()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter")
    .regex(/^[a-zA-Z\s.'-]+$/, "Nama hanya boleh huruf dan spasi"),
  rating: z.number().int().min(1).max(5),
  ulasan: z.string()
    .min(10, "Ulasan minimal 10 karakter")
    .max(250, "Ulasan maksimal 250 karakter"),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

// ─── Star Rating Input ────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function TestimonialForm() {
  const [open, setOpen] = useState(false);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { nama: "", rating: 5, ulasan: "" },
  });

  const isPending = form.formState.isSubmitting;

  const onSubmit = async (values: TestimonialFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("testimonials").insert({
      nama: values.nama.trim(),
      rating: values.rating,
      ulasan: values.ulasan.trim(),
      status: "pending",
    });

    if (error) {
      toast.error("Gagal mengirim ulasan. Coba lagi.");
      return;
    }

    toast.success("Terima kasih! Ulasan Anda sedang ditinjau oleh tim kami.");
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/30 hover:bg-primary/10">
          <MessageSquarePlus className="h-4 w-4" />
          Tulis Ulasan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Tulis Ulasan
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nama" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Nama kamu" maxLength={50} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="rating" render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <StarRating value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="ulasan" render={({ field }) => (
              <FormItem>
                <FormLabel>Ulasan ({field.value.length}/250)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ceritakan pengalaman kamu bertransaksi di Iku Gadget..."
                    maxLength={250}
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim Ulasan
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              Ulasan akan ditampilkan setelah ditinjau oleh tim kami.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
