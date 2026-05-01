import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Search, X, Download } from "lucide-react";
import * as XLSX from "xlsx";

const JENIS_UNIT_OPTIONS = ["Semua", "HP", "Laptop", "Tablet", "Aksesoris", "Smartwatch", "Lainnya"];

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

interface JournalFiltersProps {
  data: JournalEntry[];
  onFiltered: (filtered: JournalEntry[]) => void;
}

export default function JournalFilters({ data, onFiltered }: JournalFiltersProps) {
  const [search, setSearch] = useState("");
  const [jenisUnit, setJenisUnit] = useState("Semua");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filtered = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.nama_seller.toLowerCase().includes(q) ||
          r.nama_unit.toLowerCase().includes(q)
      );
    }

    if (jenisUnit !== "Semua") {
      result = result.filter((r) => r.jenis_unit === jenisUnit);
    }

    if (dateFrom) {
      const from = dateFrom.toISOString().split("T")[0];
      result = result.filter((r) => r.tanggal >= from);
    }

    if (dateTo) {
      const to = dateTo.toISOString().split("T")[0];
      result = result.filter((r) => r.tanggal <= to);
    }

    onFiltered(result);
    return result;
  }, [data, search, jenisUnit, dateFrom, dateTo, onFiltered]);

  const clearFilters = () => {
    setSearch("");
    setJenisUnit("Semua");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = search || jenisUnit !== "Semua" || dateFrom || dateTo;

  const exportToExcel = () => {
    const rows = filtered.map((r) => {
      const profit = r.harga_jual - r.harga_beli - r.biaya_operasional;
      return {
        Tanggal: new Date(r.tanggal).toLocaleDateString("id-ID"),
        "Nama Seller": r.nama_seller,
        "Jenis Unit": r.jenis_unit,
        "Nama Unit": r.nama_unit,
        "Harga Jual": r.harga_jual,
        "Harga Beli": r.harga_beli,
        "Biaya Operasional": r.biaya_operasional,
        Keterangan: r.keterangan_biaya || "-",
        Profit: profit,
        "Profit Seller (50%)": profit / 2,
        "Profit Toko (50%)": profit / 2,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto column widths
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jurnal Penjualan");
    XLSX.writeFile(wb, `jurnal_penjualan_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari seller atau unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Jenis Unit */}
        <Select value={jenisUnit} onValueChange={setJenisUnit}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JENIS_UNIT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[140px] justify-start text-left text-xs font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: localeId }) : "Dari tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[140px] justify-start text-left text-xs font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
              {dateTo ? format(dateTo, "dd MMM yyyy", { locale: localeId }) : "Sampai tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>
        )}

        {/* Export */}
        <Button variant="outline" size="sm" onClick={exportToExcel} disabled={filtered.length === 0}>
          <Download className="mr-1 h-3.5 w-3.5" /> Export Excel
        </Button>
      </div>

      {hasFilters && (
        <p className="text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {data.length} data
        </p>
      )}
    </div>
  );
}
