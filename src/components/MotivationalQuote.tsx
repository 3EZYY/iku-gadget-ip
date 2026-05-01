import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const QUOTES = [
  "Setiap langkah kecil membawa kita lebih dekat ke tujuan besar! 🚀",
  "Keberhasilan dimulai dari konsistensi. Terus semangat! 💪",
  "Target hari ini adalah investasi untuk masa depan. 🎯",
  "Semakin banyak usaha, semakin besar hasilnya! ⭐",
  "Jangan berhenti sampai kamu bangga dengan hasilnya! 🔥",
  "Hari ini peluang baru, semangat baru! ☀️",
  "Kerja keras tidak pernah mengkhianati hasil! 💎",
  "Jadilah yang terbaik versi dirimu hari ini! 🌟",
  "Setiap penjualan adalah langkah menuju bonus! 🏆",
  "Kamu lebih hebat dari yang kamu pikirkan! 💥",
  "Sukses adalah akumulasi dari kerja keras setiap hari! 📈",
  "Fokus pada proses, hasilnya akan mengikuti! 🎖️",
];

export default function MotivationalQuote() {
  const quote = useMemo(() => {
    const today = new Date();
    const index = (today.getDate() + today.getMonth()) % QUOTES.length;
    return QUOTES[index];
  }, []);

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-full bg-primary/20 p-2 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium italic text-foreground">{quote}</p>
      </CardContent>
    </Card>
  );
}
