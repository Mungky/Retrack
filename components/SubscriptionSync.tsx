"use client";

import { useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { getProStatus } from "@/app/actions/subscription";

const PREMIUM_THEMES = ["forest", "sultan"] as const;

/**
 * Sinkronkan status Pro dari database ke store.
 * Source of Truth: database (users.is_pro).
 * Refetch: pada login dan saat tab/window mendapat fokus kembali.
 * ThemeGuard: paksa tema default jika non-Pro atau belum login memakai tema premium.
 */
export function SubscriptionSync() {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const setProStatus = useSubscriptionStore((s) => s.setProStatus);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sync = useCallback(() => {
    if (!user?.id) {
      if (mountedRef.current) setProStatus(false);
      return;
    }
    getProStatus().then((isPro) => {
      if (mountedRef.current) setProStatus(isPro);
    });
  }, [user?.id, setProStatus]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const onFocus = () => sync();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [sync]);

  useEffect(() => {
    const current = resolvedTheme ?? theme ?? "default";
    const isPremiumTheme = PREMIUM_THEMES.includes(current as (typeof PREMIUM_THEMES)[number]);
    const shouldReset = (!user || !isPro) && isPremiumTheme;
    if (shouldReset && setTheme) {
      setTheme("default");
    }
  }, [user, isPro, theme, resolvedTheme, setTheme]);

  return null;
}
