import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ManagementDashboard from "./pages/ManagementDashboard";
import KaryawanDashboard from "./pages/KaryawanDashboard";
import PendingApproval from "./pages/PendingApproval";
import { useAuth } from "./hooks/useAuth";
import { useRole } from "./hooks/useRole";

const queryClient = new QueryClient();

/**
 * Route guard — redirects to "/" if the user's role is not in the allowed list.
 * "/" then re-dispatches to the correct route via Index.tsx.
 */
function RoleGuard({
  children,
  allowed,
}: {
  children: React.ReactNode;
  allowed: Array<"owner" | "admin" | "karyawan">;
}) {
  const { user, loading: authLoading } = useAuth();
  const { role, isApproved, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Authenticated but not yet approved → show pending screen
  if (isApproved === false) return <PendingApproval />;

  if (!role || !allowed.includes(role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public — no auth required */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role dispatcher — redirects authenticated users to their dashboard */}
          <Route path="/dashboard" element={<Index />} />

          {/*
           * Owner and Admin share ManagementDashboard.
           * The component uses useRole() internally to show/hide
           * owner-exclusive features (seller leaderboard, secondary stats, etc.)
           */}
          <Route
            path="/owner"
            element={
              <RoleGuard allowed={["owner"]}>
                <ManagementDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleGuard allowed={["admin"]}>
                <ManagementDashboard />
              </RoleGuard>
            }
          />

          {/* Karyawan — personal sales view only */}
          <Route
            path="/karyawan"
            element={
              <RoleGuard allowed={["karyawan"]}>
                <KaryawanDashboard />
              </RoleGuard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
