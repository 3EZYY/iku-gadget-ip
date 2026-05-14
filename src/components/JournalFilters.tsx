import { useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Search, X, Download, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [jenisUnit, setJenisUnit] = useState("Semua");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [importing, setImporting] = useState(false);

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

  // ─── Import Excel ─────────────────────────────────────────
  const parsePrice = (val: unknown): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      // Strip "Rp", dots, spaces, commas
      const cleaned = val.replace(/[Rp.\s]/gi, "").replace(/,/g, "");
      return Number(cleaned) || 0;
    }
    return 0;
  };

  const parseDate = (val: unknown): string => {
    if (!val) return format(new Date(), "yyyy-MM-dd");
    // If it's an Excel serial number
    if (typeof val === "number") {
      const d = XLSX.SSF.parse_date_code(val);
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    // If it's a string like "05/09/2026" or "2026-05-09"
    const str = String(val).trim();
    // Try ISO format first
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
    // Try DD/MM/YYYY
    const parts = str.split(/[/\-\.]/);
    if (parts.length === 3) {
      const [a, b, c] = parts;
      // If first part is 4 digits → YYYY-MM-DD
      if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
      // Otherwise assume DD/MM/YYYY
      return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    }
    return format(new Date(), "yyyy-MM-dd");
  };

  // Column name mapping (flexible — supports various header names)
  const COLUMN_MAP: Record<string, string> = {
    tanggal: "tanggal", date: "tanggal",
    "nama seller": "nama_seller", seller: "nama_seller", "nama_seller": "nama_seller",
    "jenis unit": "jenis_unit", jenis: "jenis_unit", "jenis_unit": "jenis_unit",
    "nama unit": "nama_unit", unit: "nama_unit", "nama_unit": "nama_unit",
    "harga jual": "harga_jual", jual: "harga_jual", "harga_jual": "harga_jual",
    "harga beli": "harga_beli", beli: "harga_beli", modal: "harga_beli", "harga_beli": "harga_beli",
    "biaya operasional": "biaya_operasional", "biaya op": "biaya_operasional", "biaya op.": "biaya_operasional", "biaya_operasional": "biaya_operasional",
    keterangan: "keterangan_biaya", "keterangan_biaya": "keterangan_biaya",
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    const toastId = toast.loading("Mengimpor data dari Excel...");

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      if (rawRows.length === 0) {
        toast.dismiss(toastId);
        toast.error("File kosong atau format tidak dikenali");
        return;
      }

      // Map columns
      const headers = Object.keys(rawRows[0]);
      const mapping: Record<string, string> = {};
      headers.forEach((h) => {
        const key = h.toLowerCase().trim();
        if (COLUMN_MAP[key]) mapping[h] = COLUMN_MAP[key];
      });

      // Validate required columns
      const mappedCols = new Set(Object.values(mapping));
      const required = ["nama_seller", "nama_unit", "harga_jual", "harga_beli"];
      const missing = required.filter((r) => !mappedCols.has(r));
      if (missing.length > 0) {
        toast.dismiss(toastId);
        toast.error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}`, {
          description: `Header yang terdeteksi: ${headers.join(", ")}`,
          duration: 8000,
        });
        return;
      }

      // Transform rows
      const rows = rawRows.map((raw) => {
        const mapped: Record<string, unknown> = {};
        Object.entries(raw).forEach(([col, val]) => {
          const dbCol = mapping[col];
          if (dbCol) mapped[dbCol] = val;
        });

        return {
          user_id: user.id,
          tanggal: parseDate(mapped.tanggal),
          nama_seller: String(mapped.nama_seller || user.email?.split("@")[0] || ""),
          jenis_unit: String(mapped.jenis_unit || "HP"),
          nama_unit: String(mapped.nama_unit || ""),
          harga_jual: parsePrice(mapped.harga_jual),
          harga_beli: parsePrice(mapped.harga_beli),
          biaya_operasional: parsePrice(mapped.biaya_operasional),
          keterangan_biaya: mapped.keterangan_biaya ? String(mapped.keterangan_biaya) : null,
        };
      }).filter((r) => r.nama_unit && r.harga_jual > 0 && r.harga_beli > 0);

      if (rows.length === 0) {
        toast.dismiss(toastId);
        toast.error("Tidak ada data valid untuk diimpor");
        return;
      }

      // Bulk insert
      const { error } = await supabase.from("journal").insert(rows);
      if (error) throw error;

      toast.dismiss(toastId);
      toast.success(`${rows.length} transaksi berhasil diimpor!`);
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    } catch (err: unknown) {
      toast.dismiss(toastId);
      toast.error((err as Error).message || "Gagal mengimpor data");
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

        {/* Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleImport}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1 h-3.5 w-3.5" />
          )}
          Import Excel
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
