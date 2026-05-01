import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JournalEntry {
  id: string;
  tanggal: string;
  nama_seller: string;
  jenis_unit: string;
  nama_unit: string;
  harga_jual: number;
  harga_beli: number;
  biaya_operasional: number;
  keterangan_biaya: string | null;
}

interface JournalTableProps {
  data: JournalEntry[];
  onRefresh: () => void;
  onEdit: (entry: JournalEntry) => void;
  isAdmin: boolean;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const unitBadgeColor = (type: string) => {
  switch (type) {
    case "HP": return "default";
    case "Laptop": return "secondary";
    case "Tablet": return "outline";
    default: return "outline" as const;
  }
};

export default function JournalTable({ data, onRefresh, onEdit, isAdmin }: JournalTableProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data ini?")) return;
    const { error } = await supabase.from("journal").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus");
    } else {
      toast.success("Data dihapus");
      onRefresh();
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Belum ada data jurnal.{isAdmin ? ' Klik "Tambah Jurnal" untuk memulai.' : ""}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Harga Jual</TableHead>
            <TableHead className="text-right">Harga Beli</TableHead>
            <TableHead className="text-right">Biaya Op.</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Seller 50%</TableHead>
            <TableHead className="text-right">Toko 50%</TableHead>
            {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => {
            const profit = entry.harga_jual - entry.harga_beli - entry.biaya_operasional;
            return (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{new Date(entry.tanggal).toLocaleDateString("id-ID")}</TableCell>
                <TableCell>{entry.nama_seller}</TableCell>
                <TableCell><Badge variant={unitBadgeColor(entry.jenis_unit)}>{entry.jenis_unit}</Badge></TableCell>
                <TableCell>{entry.nama_unit}</TableCell>
                <TableCell className="text-right">{formatRp(entry.harga_jual)}</TableCell>
                <TableCell className="text-right">{formatRp(entry.harga_beli)}</TableCell>
                <TableCell className="text-right">{formatRp(entry.biaya_operasional)}</TableCell>
                <TableCell className="max-w-[150px] truncate">{entry.keterangan_biaya || "-"}</TableCell>
                <TableCell className={`text-right font-semibold ${profit >= 0 ? "text-primary" : "text-destructive"}`}>
                  {formatRp(profit)}
                </TableCell>
                <TableCell className="text-right">{formatRp(profit / 2)}</TableCell>
                <TableCell className="text-right">{formatRp(profit / 2)}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
