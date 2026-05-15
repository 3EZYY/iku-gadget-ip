import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserWithRole } from "@/lib/auth";
import type { AppRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserPlus, Trash2, Crown, Shield, User, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────
interface UserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

interface PendingUser {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface UserManagementProps {
  callerRole: "owner" | "admin";
}

// ─── Helpers ──────────────────────────────────────────────────
const roleBadge = (role: AppRole) => {
  switch (role) {
    case "owner":
      return <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1"><Crown className="h-3 w-3" /> owner</Badge>;
    case "admin":
      return <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" /> admin</Badge>;
    case "karyawan":
      return <Badge variant="secondary" className="gap-1"><User className="h-3 w-3" /> karyawan</Badge>;
  }
};

// ─── Create User Dialog ───────────────────────────────────────
function CreateUserDialog({ callerRole, onCreated }: { callerRole: "owner" | "admin"; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("karyawan");
  const [loading, setLoading] = useState(false);

  const allowedRoles: AppRole[] = callerRole === "owner" ? ["admin", "karyawan"] : ["karyawan"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithRole(email, password, role, fullName);
      toast.success(`Akun ${role} berhasil dibuat`);
      setOpen(false);
      setFullName(""); setEmail(""); setPassword(""); setRole("karyawan");
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
        <Button size="sm"><UserPlus className="mr-2 h-4 w-4" />Tambah Akun</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Buat Akun Baru</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap" required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" required />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter" required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allowedRoles.map((r) => (
                  <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {callerRole === "admin" && (
              <p className="text-xs text-muted-foreground">Admin hanya dapat membuat akun karyawan.</p>
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

// ─── Approve User Dialog ──────────────────────────────────────
function ApproveUserDialog({
  user,
  callerRole,
  onApproved,
}: {
  user: PendingUser;
  callerRole: "owner" | "admin";
  onApproved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<AppRole>("karyawan");
  const [loading, setLoading] = useState(false);

  const allowedRoles: AppRole[] = callerRole === "owner" ? ["admin", "karyawan"] : ["karyawan"];

  const handleApprove = async () => {
    setLoading(true);
    try {
      // Try RPC first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabase.rpc as any)("approve_user", {
        _target_user_id: user.user_id,
        _role: role,
      });

      if (rpcError) {
        // Fallback: direct update if RPC not available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateErr } = await (supabase as any)
          .from("profiles")
          .update({ is_approved: true })
          .eq("id", user.user_id);
        if (updateErr) throw updateErr;

        // Also upsert role
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: roleErr } = await (supabase as any)
          .from("user_roles")
          .upsert({ user_id: user.user_id, role }, { onConflict: "user_id" });
        if (roleErr) throw roleErr;
      }

      toast.success(`${user.email} disetujui sebagai ${role}`);
      setOpen(false);
      onApproved();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyetujui akun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Setujui
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Setujui Akun
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <p className="font-medium">{user.full_name || user.email}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="space-y-2">
            <Label>Tetapkan Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allowedRoles.map((r) => (
                  <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Setujui Akses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Commission % Editor ──────────────────────────────────────
function CommissionEditor({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [value, setValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch current value
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("profiles")
      .select("komisi_persen")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }: { data: { komisi_persen: number } | null }) => {
        setValue(data?.komisi_persen ?? 50);
      });
  }, [userId]);

  const handleSave = async (newVal: number) => {
    if (newVal === value) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ komisi_persen: newVal })
      .eq("id", userId);
    if (error) {
      toast.error("Gagal update komisi");
    } else {
      setValue(newVal);
      toast.success(`Komisi diubah ke ${newVal}%`);
      onSaved();
    }
    setSaving(false);
  };

  if (value === null) return null;

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => handleSave(Number(v))}
      disabled={saving}
    >
      <SelectTrigger className="h-6 w-[70px] text-[10px] px-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[30, 35, 40, 45, 50, 55, 60, 65, 70].map((pct) => (
          <SelectItem key={pct} value={String(pct)} className="text-xs">
            {pct}%
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function UserManagement({ callerRole }: UserManagementProps) {
  const queryClient = useQueryClient();

  // Active users
  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["user-list"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_list");
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });

  // Pending users (unapproved)
  const { data: pendingUsers = [], isLoading: pendingLoading } = useQuery<PendingUser[]>({
    queryKey: ["pending-users"],
    queryFn: async () => {
      // Try RPC first (zero arguments — do NOT pass a second arg)
      try {
        const { data, error } = await supabase.rpc("get_user_list").throwOnError();
        // get_user_list returns all users — we can't use get_pending_users via typed client
        // So use direct query approach which is more reliable
        void data; void error;
      } catch {
        // ignore — just use fallback
      }

      // Direct query on profiles where is_approved = false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, email, full_name, created_at")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[PendingUsers] Query error:", error.message, error.details);
        throw new Error(error.message);
      }

      // Map 'id' to 'user_id' to match PendingUser interface
      return (data ?? []).map((row: { id: string; email: string; full_name: string | null; created_at: string }) => ({
        user_id: row.id,
        email: row.email ?? "",
        full_name: row.full_name,
        created_at: row.created_at,
      })) as PendingUser[];
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { error } = await supabase.rpc("remove_user_role", { _target_user_id: targetUserId });
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
    if (callerRole === "owner") return targetRole !== "owner";
    if (callerRole === "admin") return targetRole === "karyawan";
    return false;
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["user-list"] });
    queryClient.invalidateQueries({ queryKey: ["pending-users"] });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Manajemen Pengguna
            {pendingUsers.length > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                {pendingUsers.length} pending
              </Badge>
            )}
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
        <Tabs defaultValue={pendingUsers.length > 0 ? "pending" : "active"}>
          <TabsList className="mb-4 h-8">
            <TabsTrigger value="active" className="text-xs">
              Aktif ({users.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs gap-1.5">
              <Clock className="h-3 w-3" />
              Menunggu Persetujuan
              {pendingUsers.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 text-white text-[9px] px-1.5 py-0 font-bold">
                  {pendingUsers.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Active Users ─────────────────────────────────── */}
          <TabsContent value="active">
            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Memuat daftar pengguna...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Belum ada pengguna terdaftar.</div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.full_name || u.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {/* Commission % editor for karyawan */}
                      {u.role === "karyawan" && (
                        <CommissionEditor userId={u.user_id} onSaved={refresh} />
                      )}
                      {roleBadge(u.role)}
                      {canDelete(u.role) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus akun ini?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Akun <strong>{u.email}</strong> akan kehilangan aksesnya. Data transaksi tidak akan terhapus.
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
          </TabsContent>

          {/* ── Pending Approvals ─────────────────────────────── */}
          <TabsContent value="pending">
            {pendingLoading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Memuat...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 opacity-30" />
                <p className="text-sm">Tidak ada akun yang menunggu persetujuan.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Pengguna berikut mendaftar via Google atau self-register dan menunggu persetujuan akses.
                </p>
                {pendingUsers.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Daftar: {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500 gap-1">
                        <Clock className="h-2.5 w-2.5" /> Pending
                      </Badge>
                      <ApproveUserDialog user={u} callerRole={callerRole} onApproved={refresh} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
