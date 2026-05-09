import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface SellerOption {
  id: string;
  name: string;
}

interface TransactionFormProps {
  onAdd: (t: {
    seller: string;
    sellerId: string;
    unit: number;
    modal: number;
    jual: number;
    profit: number;
    investorShare: number;
    sellerShare: number;
    date: string;
  }) => void;
  sellers: SellerOption[];
}

const TransactionForm = ({ onAdd, sellers }: TransactionFormProps) => {
  const [form, setForm] = useState({ sellerId: "", unit: 1, modal: 0, jual: 0 });

  const handleSubmit = () => {
    const seller = sellers.find((s) => s.id === form.sellerId);
    if (!seller) return;
    const profit = form.jual - form.modal;
    onAdd({
      seller: seller.name,
      sellerId: seller.id,
      unit: form.unit,
      modal: form.modal,
      jual: form.jual,
      profit,
      investorShare: profit * 0.5,
      sellerShare: profit * 0.5,
      date: new Date().toLocaleDateString("id-ID"),
    });
    setForm({ sellerId: sellers[0]?.id || "", unit: 1, modal: 0, jual: 0 });
  };

  // Set default seller when sellers load
  if (!form.sellerId && sellers.length > 0) {
    setForm((f) => ({ ...f, sellerId: sellers[0].id }));
  }

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-card-foreground">Tambah Transaksi</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={form.sellerId}
            onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
          >
            {sellers.length === 0 && <option value="">Belum ada seller</option>}
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: Number(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="Modal"
            value={form.modal}
            onChange={(e) => setForm({ ...form, modal: Number(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="Harga Jual"
            value={form.jual}
            onChange={(e) => setForm({ ...form, jual: Number(e.target.value) })}
          />
        </div>
        <Button onClick={handleSubmit} className="gap-2" disabled={sellers.length === 0}>
          <Plus className="w-4 h-4" />
          Tambah Transaksi
        </Button>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
