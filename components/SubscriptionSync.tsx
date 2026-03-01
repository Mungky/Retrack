"use client";

import { useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { getProStatus } from "@/app/actions/subscription";

const PREMIUM_THEMES = ["forest", "sultan"] as const;
const STORAGE_KEY = "remula-theme";

/** Retry getProStatus jika return false tapi user punya premium theme di localStorage (session mungkin belum ready) */
const PRO_STATUS_RETRY_MS = 2000;

/**
 * Sinkronkan status Pro dari database ke store.
 * Source of Truth: database (users.is_pro).
 * Refetch: pada login dan saat tab/window mendapat fokus kembali.
 * ThemeGuard: paksa tema default jika non-Pro atau belum login memakai tema premium.
 * Guard dieksekusi LANGSUNG setelah getProStatus resolved (bukan di useEffect) untuk menghindari race condition.
 */
export function SubscriptionSync() {
  const { user, sessionCheckComplete } = useAuth();
  const { setTheme } = useTheme();
  const setProStatus = useSubscriptionStore((s) => s.setProStatus);
  const setProStatusSettled = useSubscriptionStore((s) => s.setProStatusSettled);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runThemeGuard = useCallback(
    (isPremiumUser: boolean) => {
      if (typeof window === "undefined") return;
      const current = localStorage.getItem(STORAGE_KEY) ?? "default";
      const isPremiumTheme = PREMIUM_THEMES.includes(current as (typeof PREMIUM_THEMES)[number]);
      if (!isPremiumUser && isPremiumTheme) {
        setTheme("default");
      }
    },
    [setTheme]
  );

  const sync = useCallback(() => {
    if (!user?.id) {
      if (mountedRef.current) {
        setProStatus(false);
        setProStatusSettled(true);
      }
      if (sessionCheckComplete) {
        runThemeGuard(false);
      }
      return;
    }

    setProStatusSettled(false);
    const run = async () => {
      let isPremiumUser = await getProStatus();
      if (!isPremiumUser && typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && PREMIUM_THEMES.includes(stored as (typeof PREMIUM_THEMES)[number])) {
          await new Promise((r) => setTimeout(r, PRO_STATUS_RETRY_MS));
          isPremiumUser = await getProStatus();
        }
      }

      if (mountedRef.current) {
        if (process.env.NODE_ENV === "development") {
          console.log("[SubscriptionSync] Pro Status Result:", isPremiumUser);
        }
        setProStatus(isPremiumUser);
        setProStatusSettled(true);
        runThemeGuard(isPremiumUser);
      }
    };
    run();
  }, [user?.id, sessionCheckComplete, setProStatus, setProStatusSettled, setTheme, runThemeGuard]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const onFocus = () => sync();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [sync]);

  return null;
}
