/**
 * DarkModeToggle.tsx — Toggle dark/light mode untuk Landing Page
 * Menggunakan next-themes untuk persistensi preferensi
 */

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LandingDarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg" style={{ background: "hsl(222 35% 14%)" }} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105"
      style={{
        background: isDark ? "hsl(0 0% 15%)" : "hsl(0 0% 95%)",
        border: `1px solid ${isDark ? "hsl(0 0% 25%)" : "hsl(0 0% 85%)"}`,
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-white" />
      ) : (
        <Moon className="h-4 w-4 text-black" />
      )}
    </button>
  );
}
