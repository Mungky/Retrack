"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { usePremiumModal } from "@/stores/premiumModalStore";
import { useToast } from "@/contexts/ToastContext";
import { updateUserTheme } from "@/app/actions/user";

const STORAGE_KEY = "remula-theme";

type ThemeId = "default" | "sultan" | "forest";

const THEMES: {
  id: ThemeId;
  label: string;
  preview: string;
  icon: string;
}[] = [
  {
    id: "default",
    label: "Default",
    preview: "from-violet-600 to-violet-800",
    icon: "◆",
  },
  {
    id: "sultan",
    label: "Sultan",
    preview: "from-black via-amber-900/80 to-amber-700",
    icon: "👑",
  },
  {
    id: "forest",
    label: "Forest",
    preview: "from-emerald-200 via-green-100 to-teal-100",
    icon: "🌲",
  },
];

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const { open: openPremium } = usePremiumModal();
  const { showToast } = useToast();

  useEffect(() => setMounted(true), []);

  const currentTheme = (mounted ? (theme || resolvedTheme || "default") : "default") as ThemeId;

  const handleThemeClick = async (id: ThemeId) => {
    if ((id === "sultan" || id === "forest") && !isPro) {
      openPremium();
      return;
    }
    setTheme(id);
    const result = await updateUserTheme(id);
    if (!result.success) {
      if (result.error?.includes("Premium")) {
        setTheme("default");
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, "default");
        }
      } else if (!result.error?.includes("Not authenticated")) {
        showToast(result.error ?? "Gagal menyinkronkan tema", "error");
      }
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        Choose app theme
      </p>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((t) => {
          const isLocked = !isPro && (t.id === "sultan" || t.id === "forest");
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleThemeClick(t.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                "hover:scale-[1.02] active:scale-[0.98]",
                currentTheme === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/50",
                isLocked && "opacity-75"
              )}
            >
              <div
                className={cn(
                  "w-full aspect-[4/3] rounded-lg bg-gradient-to-br relative",
                  t.preview,
                  isLocked && "opacity-80"
                )}
              >
                {isLocked && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <Lock size={20} className="text-white drop-shadow" />
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-lg leading-none",
                  currentTheme === t.id ? "opacity-100" : "opacity-70"
                )}
              >
                {t.icon}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  currentTheme === t.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t.label}
              </span>
              {currentTheme === t.id && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
