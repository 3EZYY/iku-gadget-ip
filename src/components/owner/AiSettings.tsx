import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch current key
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("site_settings")
      .select("gemini_api_key")
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: { gemini_api_key: string | null } | null }) => {
        if (data?.gemini_api_key) setApiKey(data.gemini_api_key);
        setFetching(false);
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("site_settings")
        .update({ gemini_api_key: apiKey || null, updated_at: new Date().toISOString() })
        .not("id", "is", null); // update all rows (there's only 1)

      if (error) throw error;
      toast.success("API Key Gemini berhasil disimpan");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Pengaturan AI Chatbot
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Konfigurasi Google Gemini API Key untuk fitur AI Assistant di Landing Page.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {fetching ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="gemini-key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleSave} disabled={loading} size="sm" className="gap-1.5">
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Dapatkan API Key dari{" "}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                  Google AI Studio
                </a>
                . Key disimpan terenkripsi di database.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <p className="font-medium">Status: {apiKey ? "✅ Aktif" : "❌ Belum dikonfigurasi"}</p>
              <p className="text-muted-foreground">Rate limit: 15 pesan/jam per IP visitor</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
