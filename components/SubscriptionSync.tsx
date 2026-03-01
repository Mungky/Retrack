"use client";

import { useEffect, useRef } from "react";
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
 * Semua async logic di dalam useEffect untuk mematuhi React async rules.
 */
export function SubscriptionSync() {
  const { user, sessionCheckComplete } = useAuth();
  const { setTheme } = useTheme();
  const setProStatus = useSubscriptionStore((s) => s.setProStatus);
  const setProStatusSettled = useSubscriptionStore((s) => s.setProStatusSettled);
  const mountedRef = useRef(true);
  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function checkUserStatus() {
      if (!user?.id) {
        if (mountedRef.current) {
          setProStatus(false);
          setProStatusSettled(true);
        }
        if (sessionCheckComplete && typeof window !== "undefined") {
          const current = localStorage.getItem(STORAGE_KEY) ?? "default";
          const isPremiumTheme = PREMIUM_THEMES.includes(current as (typeof PREMIUM_THEMES)[number]);
          if (isPremiumTheme && setThemeRef.current) {
            setThemeRef.current("default");
          }
        }
        return;
      }

      setProStatusSettled(false);
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
        const current = localStorage.getItem(STORAGE_KEY) ?? "default";
        const isPremiumTheme = PREMIUM_THEMES.includes(current as (typeof PREMIUM_THEMES)[number]);
        if (!isPremiumUser && isPremiumTheme && setThemeRef.current) {
          setThemeRef.current("default");
        }
      }
    }

    checkUserStatus();
  }, [user?.id, sessionCheckComplete, setProStatus, setProStatusSettled]);

  useEffect(() => {
    async function onFocus() {
      if (!user?.id) return;
      setProStatusSettled(false);
      let isPremiumUser = await getProStatus();
      if (mountedRef.current) {
        setProStatus(isPremiumUser);
        setProStatusSettled(true);
        const current = localStorage.getItem(STORAGE_KEY) ?? "default";
        const isPremiumTheme = PREMIUM_THEMES.includes(current as (typeof PREMIUM_THEMES)[number]);
        if (!isPremiumUser && isPremiumTheme && setThemeRef.current) {
          setThemeRef.current("default");
        }
      }
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.id, setProStatus, setProStatusSettled]);

  return null;
}
