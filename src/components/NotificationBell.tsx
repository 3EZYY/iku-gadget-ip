import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

interface Visit {
  id: string;
  seller_email: string;
  visited_at: string;
  seen: boolean;
}

export default function NotificationBell() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();

  const fetchVisits = async () => {
    const { data } = await supabase
      .from("seller_visits")
      .select("*")
      .order("visited_at", { ascending: false })
      .limit(20);
    setVisits((data as Visit[]) || []);
  };

  useEffect(() => {
    if (roleLoading || !user) return;
    fetchVisits();

    // Admins receive all visit events; sellers only receive their own rows.
    // RLS on seller_visits already enforces this server-side, but we add an
    // explicit filter so non-matching rows are never sent over the channel.
    const filter = isAdmin ? undefined : `seller_user_id=eq.${user.id}`;

    const channel = supabase
      .channel("seller-visits-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "seller_visits", ...(filter ? { filter } : {}) },
        (payload) => {
          setVisits((prev) => [payload.new as Visit, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, roleLoading]);

  const unseenCount = visits.filter((v) => !v.seen).length;

  const markAllSeen = async () => {
    const unseenIds = visits.filter((v) => !v.seen).map((v) => v.id);
    if (unseenIds.length === 0) return;
    await supabase
      .from("seller_visits")
      .update({ seen: true })
      .in("id", unseenIds);
    setVisits((prev) => prev.map((v) => ({ ...v, seen: true })));
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unseenCount > 0) {
      markAllSeen();
    }
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unseenCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unseenCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">Notifikasi Kunjungan Seller</p>
        </div>
        <ScrollArea className="h-[300px]">
          {visits.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Belum ada kunjungan seller
            </div>
          ) : (
            <div className="divide-y">
              {visits.map((v) => (
                <div
                  key={v.id}
                  className={`p-3 text-sm ${!v.seen ? "bg-primary/5" : ""}`}
                >
                  <p className="font-medium">{v.seller_email}</p>
                  <p className="text-xs text-muted-foreground">
                    Membuka website • {formatTime(v.visited_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
