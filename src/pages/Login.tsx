import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signIn } from "@/lib/auth";
import { toast } from "sonner";
import { Smartphone, AlertTriangle } from "lucide-react";

// Detect missing/invalid env at render time so the user sees it immediately
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const ENV_INVALID = !SUPABASE_KEY || SUPABASE_KEY.length < 100;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ENV_INVALID) {
      toast.error(
        "Koneksi database gagal. Periksa konfigurasi API Key dan restart server lokal.",
        { duration: 6000 }
      );
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg: string = (err as Error)?.message ?? "";

      if (
        msg.toLowerCase().includes("invalid api key") ||
        msg.toLowerCase().includes("apikey") ||
        msg.toLowerCase().includes("jwt")
      ) {
        toast.error(
          "Koneksi database gagal. Periksa konfigurasi API Key dan restart server lokal.",
          { duration: 8000 }
        );
      } else if (msg.toLowerCase().includes("invalid login credentials")) {
        toast.error("Email atau password salah.");
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        toast.error("Email belum dikonfirmasi. Periksa inbox atau hubungi admin.");
      } else {
        toast.error(msg || "Gagal masuk. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Iku Gadget & Stuff</CardTitle>
          <CardDescription>Masuk ke dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Dev warning banner — only shown when env is misconfigured */}
          {ENV_INVALID && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Konfigurasi tidak valid.</strong> <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> di
                file <code>.env</code> kosong atau terpotong. Salin ulang anon key dari Supabase
                Dashboard lalu restart dev server.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || ENV_INVALID}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
