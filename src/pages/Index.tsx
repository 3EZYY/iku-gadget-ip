import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based redirect
  if (role === "owner") return <Navigate to="/owner" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "karyawan") return <Navigate to="/karyawan" replace />;

  // No role assigned yet — show a waiting screen
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold">Akun belum memiliki role.</p>
        <p className="text-sm text-muted-foreground">
          Hubungi admin untuk mendapatkan akses.
        </p>
      </div>
    </div>
  );
}
