import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserWithRole } from "@/lib/auth";
import type { AppRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { UserPlus, Trash2, Crown, Shield, User } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────
interface UserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

interface UserManagementProps {
  /** 'owner' can create/delete admin+karyawan; 'admin' can only manage karyawan */
  callerRole: "owner" | "admin";
}

// ─── Helpers ──────────────────────────────────────────────────
const roleBadge = (role: AppRole) => {
  switch (role) {
    case "owner":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1">
          <Crown className="h-3 w-3" /> owner
        </Badge>
      );
    case "admin":
      return (
        <Badge variant="default" className="gap-1">
          <Shield className="h-3 w-3" /> admin
        </Badge>
      );
    case "karyawan":
      return (
        <Badge variant="secondary" className="gap-1">
          <User className="h-3 w-3" /> karyawan
        </Badge>
      );
  }
};

// ─── Create User Dialog ───────────────────────────────────────
function CreateUserDialog({
  callerRole,
  onCreated,
}: {
  callerRole: "owner" | "admin";
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("karyawan");
  const [loading, setLoading] = useState(false);

  // Roles this caller is allowed to create
  const allowedRoles: AppRole[] =
    callerRole === "owner" ? ["admin", "karyawan"] : ["karyawan"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithRole(email, password, role, fullName);
      toast.success(`Akun ${role} berhasil dibuat`);
      setOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("karyawan");
      onCreated();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal membuat akun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Akun
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Akun Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 karakter"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AppRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {callerRole === "admin" && (
              <p className="text-xs text-muted-foreground">
                Admin hanya dapat membuat akun karyawan.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Membuat akun..." : "Buat Akun"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function UserManagement({ callerRole }: UserManagementProps) {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["user-list"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_list");
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { error } = await supabase.rpc("remove_user_role", {
        _target_user_id: targetUserId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-list"] });
      toast.success("Akun berhasil dihapus");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus akun");
    },
  });

  const canDelete = (targetRole: AppRole) => {
    if (callerRole === "owner") return targetRole !== "owner"; // owner can't delete themselves via this UI
    if (callerRole === "admin") return targetRole === "karyawan";
    return false;
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["user-list"] });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Manajemen Pengguna
          </CardTitle>
          <CreateUserDialog callerRole={callerRole} onCreated={refresh} />
        </div>
        <p className="text-xs text-muted-foreground">
          {callerRole === "owner"
            ? "Owner dapat membuat dan menghapus akun admin & karyawan."
            : "Admin dapat membuat dan menghapus akun karyawan."}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Memuat daftar pengguna...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Belum ada pengguna terdaftar.
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {u.full_name || u.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {roleBadge(u.role)}
                  {canDelete(u.role) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus akun ini?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Akun <strong>{u.email}</strong> akan kehilangan
                            aksesnya. Data transaksi yang sudah diinput tidak
                            akan terhapus.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteUser.mutate(u.user_id)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
