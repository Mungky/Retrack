"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { getProStatusAndTheme } from "@/app/actions/user";

const STORAGE_KEY = "remula-theme";

/**
 * Sinkronkan status Pro dan tema dari database ke store dan UI.
 * Source of Truth: database (users.is_pro, users.theme).
 * Refetch: pada login dan saat tab/window mendapat fokus kembali.
 */
export function SubscriptionSync() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const setProStatus = useSubscriptionStore((s) => s.setProStatus);
  const setProStatusSettled = useSubscriptionStore((s) => s.setProStatusSettled);
  const mountedRef = useRef(true);
  const setThemeRef = useRef(setTheme);
  const themeRef = useRef<string | undefined>(undefined);
  setThemeRef.current = setTheme;
  themeRef.current = theme ?? undefined;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    themeRef.current = theme ?? undefined;
  }, [theme]);

  useEffect(() => {
    async function checkUserStatus() {
      if (!user?.id) {
        if (mountedRef.current) {
          setProStatus(false);
          setProStatusSettled(true);
        }
        return;
      }

      setProStatusSettled(false);
      const payload = await getProStatusAndTheme();

      if (mountedRef.current && payload) {
        if (process.env.NODE_ENV === "development") {
          console.log("[SubscriptionSync] Pro & Theme:", payload);
        }
        setProStatus(payload.isPro);
        setProStatusSettled(true);

        const themeFromDb = payload.isPro ? payload.theme : payload.theme === "sultan" || payload.theme === "forest" ? "default" : payload.theme;
        const current = themeRef.current ?? "default";
        if (themeFromDb !== current && setThemeRef.current) {
          setThemeRef.current(themeFromDb);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, themeFromDb);
          }
        }
      }
    }

    checkUserStatus();
  }, [user?.id, setProStatus, setProStatusSettled]);

  useEffect(() => {
    async function onFocus() {
      if (!user?.id) return;
      setProStatusSettled(false);
      const payload = await getProStatusAndTheme();
      if (mountedRef.current && payload) {
        setProStatus(payload.isPro);
        setProStatusSettled(true);
        const themeFromDb = payload.isPro ? payload.theme : payload.theme === "sultan" || payload.theme === "forest" ? "default" : payload.theme;
        const current = themeRef.current ?? "default";
        if (themeFromDb !== current && setThemeRef.current) {
          setThemeRef.current(themeFromDb);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, themeFromDb);
          }
        }
      }
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.id, setProStatus, setProStatusSettled]);

  return null;
}
