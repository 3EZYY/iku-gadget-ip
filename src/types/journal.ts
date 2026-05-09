// Shared domain types used across features

export interface JournalEntry {
  id: string;
  tanggal: string;
  nama_seller: string;
  jenis_unit: string;
  nama_unit: string;
  harga_jual: number;
  harga_beli: number;
  biaya_operasional: number;
  keterangan_biaya: string | null;
  user_id: string;
}

export interface SellerStat {
  nama_seller: string;
  transaksi: number;
  totalJual: number;
  totalProfit: number;
  komisi: number;
}

export const JENIS_UNIT_OPTIONS = [
  "HP",
  "Laptop",
  "Tablet",
  "Aksesoris",
  "Smartwatch",
  "Lainnya",
] as const;

export type JenisUnit = (typeof JENIS_UNIT_OPTIONS)[number];

/** Calculate profit from a journal entry */
export function calcProfit(entry: Pick<JournalEntry, "harga_jual" | "harga_beli" | "biaya_operasional">): number {
  return Number(entry.harga_jual) - Number(entry.harga_beli) - Number(entry.biaya_operasional);
}

/** Format number as Indonesian Rupiah */
export function formatRp(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}
