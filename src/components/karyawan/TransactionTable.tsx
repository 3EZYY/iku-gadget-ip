import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText } from "lucide-react";
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

interface Transaction {
  id?: string;
  seller: string;
  unit: number;
  modal: number;
  jual: number;
  profit: number;
  investorShare: number;
  sellerShare: number;
  date: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

const TransactionTable = ({ transactions, isAdmin, onDelete }: TransactionTableProps) => {
  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-card-foreground">Jurnal Transaksi</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {transactions.length} catatan
          </Badge>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tanggal</th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Seller</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Unit</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Modal</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Jual</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Profit</th>
                {isAdmin && <th className="p-3 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Belum ada transaksi</p>
                  </td>
                </tr>
              )}
              {transactions.map((t, i) => (
                <tr
                  key={t.id || i}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3 text-muted-foreground">{t.date}</td>
                  <td className="p-3 font-medium">{t.seller}</td>
                  <td className="p-3 text-right">{t.unit}</td>
                  <td className="p-3 text-right text-muted-foreground">Rp {t.modal.toLocaleString("id-ID")}</td>
                  <td className="p-3 text-right">Rp {t.jual.toLocaleString("id-ID")}</td>
                  <td className="p-3 text-right">
                    <span className={`font-bold ${t.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                      Rp {t.profit.toLocaleString("id-ID")}
                    </span>
                  </td>
                  {isAdmin && onDelete && t.id && (
                    <td className="p-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
                            <AlertDialogDescription>
                              Yakin ingin menghapus transaksi ini? Tindakan ini tidak bisa dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(t.id!)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionTable;
