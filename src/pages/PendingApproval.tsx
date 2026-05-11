import { Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Lock className="h-10 w-10 text-amber-500" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Menunggu Persetujuan
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Akun kamu (<span className="font-medium text-foreground">{user?.email}</span>) sudah
            terdaftar, tapi belum disetujui oleh Owner atau Admin.
          </p>
          <p className="text-muted-foreground text-sm">
            Hubungi Owner atau Admin toko untuk mendapatkan akses ke sistem.
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-border bg-card p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Apa yang terjadi selanjutnya?
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">1.</span>
              Owner atau Admin akan melihat permintaan akses kamu di panel Kelola Pengguna.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">2.</span>
              Mereka akan menyetujui dan menetapkan role yang sesuai.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">3.</span>
              Setelah disetujui, login ulang untuk mengakses dashboard.
            </li>
          </ul>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="gap-2 w-full"
        >
          <LogOut className="h-4 w-4" />
          Keluar & Coba Akun Lain
        </Button>
      </div>
    </div>
  );
}
