"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { useCycleStore } from "@/stores/cycleStore";
import { getProStatusAndTheme, getCyclePrefs } from "@/app/actions/user";
import { supabaseClient } from "@/lib/supabase-client";
import type { ThemeId } from "@/app/actions/user";

const STORAGE_KEY = "remula-theme";
const SESSION_READY_DELAY_MS = 500;
const RETRY_DELAYS_MS = [500, 800, 1200];
const VALID_THEMES: ThemeId[] = ["default", "sultan", "forest"];

/**
 * Sinkronkan status Pro, tema, dan cycle dari database ke store dan UI.
 * Source of Truth: database (users.isPro, users.theme, users.cycle_type, users.paycheck_date).
 * Fetch dari DB saat: session siap + user login, auth change (SIGNED_IN/TOKEN_REFRESHED), window focus.
 * Fallback: jika server action gagal, fetch langsung dari Supabase client (RLS).
 * TIDAK mengandalkan localStorage untuk isPro/theme/cycle — selalu fetch dari DB.
 */
export function SubscriptionSync() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const setProStatus = useSubscriptionStore((s) => s.setProStatus);
  const setProStatusSettled = useSubscriptionStore((s) => s.setProStatusSettled);
  const setCycle = useCycleStore((s) => s.setCycle);
  const mountedRef = useRef(true);
  const setThemeRef = useRef(setTheme);
  const themeRef = useRef<string | undefined>(undefined);
  const userRef = useRef(user?.id);
  setThemeRef.current = setTheme;
  themeRef.current = theme ?? undefined;
  userRef.current = user?.id;

  useEffect(() => {
    setMounted(true);
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    themeRef.current = theme ?? undefined;
  }, [theme]);

  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncFromDb = async (retryIndex = 0) => {
    let uid = userRef.current;

    // Pastikan session benar-benar ada (setelah Clear Site Data, session bisa delay)
    if (!uid) {
      const { data: { session } } = await supabaseClient.auth.getSession();
      uid = session?.user?.id ?? undefined;
      if (uid) userRef.current = uid;
    }

    console.log("Mencoba syncFromDb dengan UID:", uid ?? "(null)");

    if (!uid) {
      if (mountedRef.current) {
        setProStatus(false);
        setProStatusSettled(true);
        setCycle("calendar", 1);
      }
      return;
    }

    setProStatusSettled(false);

    // 1. UTAMA: fetch langsung dari Supabase client (session client-side, no cache)
    let payload: { isPro: boolean; theme: ThemeId } | null = null;
    let cyclePrefs: { cycleType: "calendar" | "paycheck"; paycheckDate: number } | null = null;

    const { data: userRow, error: clientError } = await supabaseClient
      .from("users")
      .select("isPro, theme, cycle_type, paycheck_date")
      .eq("id", uid)
      .maybeSingle();

    if (clientError) {
      console.error("Gagal fetch client Supabase, alasan:", clientError.message);
    }
    if (userRow) {
      const row = userRow as { isPro?: boolean; theme?: string; cycle_type?: string; paycheck_date?: number };
      payload = {
        isPro: row.isPro === true,
        theme: (row.theme && VALID_THEMES.includes(row.theme as ThemeId)) ? (row.theme as ThemeId) : "default",
      };
      cyclePrefs = {
        cycleType: row.cycle_type === "paycheck" ? "paycheck" : "calendar",
        paycheckDate: Math.max(1, Math.min(31, Number(row.paycheck_date) || 1)),
      };
    }

    // 2. Fallback: server actions (jika client fetch gagal)
    if (!payload) {
      const [serverPayload, serverCycle] = await Promise.all([
        getProStatusAndTheme(),
        getCyclePrefs(),
      ]);
      payload = serverPayload;
      cyclePrefs = serverCycle;
    }

    if (!mountedRef.current) return;

    if (payload) {
      const isPro = payload.isPro;
      const themeFromDb = payload.isPro
        ? payload.theme
        : payload.theme === "sultan" || payload.theme === "forest"
          ? "default"
          : payload.theme;
      const paycheck = cyclePrefs?.paycheckDate ?? 1;

      console.log("Hasil akhir data yg disuntik ke Store:", { isPro, theme: themeFromDb, paycheck });

      setProStatus(isPro);
      setProStatusSettled(true);

      if (cyclePrefs) {
        setCycle(cyclePrefs.cycleType, cyclePrefs.paycheckDate);
      }

      if (setThemeRef.current) {
        setThemeRef.current(themeFromDb);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, themeFromDb);
        }
      }
    } else {
      if (retryIndex < RETRY_DELAYS_MS.length) {
        console.warn("[SubscriptionSync] Fetch gagal, retry ke", retryIndex + 1, "dalam", RETRY_DELAYS_MS[retryIndex], "ms");
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(
          () => syncFromDb(retryIndex + 1),
          RETRY_DELAYS_MS[retryIndex]
        );
      } else {
        console.warn("[SubscriptionSync] Fetch gagal setelah semua retry. State TIDAK di-overwrite (tetap pakai nilai terakhir).");
        setProStatusSettled(true);
      }
    }
  };

  // Sync saat mount + user terdeteksi — TUNDA 500ms agar cookies session siap
  useEffect(() => {
    if (!mounted || !user?.id) return;

    const t = setTimeout(() => {
      userRef.current = user.id;
      syncFromDb(0);
    }, SESSION_READY_DELAY_MS);

    return () => {
      clearTimeout(t);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [mounted, user?.id]);

  // Sync saat auth state change — TUNDA 500ms pada SIGNED_IN agar cookies ter-set
  useEffect(() => {
    if (!mounted) return;

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user?.id) {
          userRef.current = session.user.id;
          setTimeout(() => syncFromDb(0), SESSION_READY_DELAY_MS);
        }
      }
      if (event === "SIGNED_OUT") {
        userRef.current = undefined;
        setProStatus(false);
        setProStatusSettled(true);
        setCycle("calendar", 1);
      }
    });

    return () => subscription.unsubscribe();
  }, [mounted]);

  // Sync saat window focus
  useEffect(() => {
    if (!mounted || !user?.id) return;

    const onFocus = () => syncFromDb(0);

    if (typeof window === "undefined") return;
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [mounted, user?.id]);

  // Log CLIENT STATE saat store berubah (untuk debugging)
  const isPro = useSubscriptionStore((s) => s.isPro);
  const proStatusSettled = useSubscriptionStore((s) => s.proStatusSettled);
  const cycleType = useCycleStore((s) => s.cycleType);
  const paycheckDate = useCycleStore((s) => s.paycheckDate);
  const effectiveTheme = resolvedTheme ?? theme ?? "default";

  useEffect(() => {
    if (proStatusSettled) {
      console.log("[SubscriptionSync] CLIENT STATE:", {
        isPro,
        theme: effectiveTheme,
        paycheckDate,
        cycleType,
        proStatusSettled,
      });
    }
  }, [isPro, effectiveTheme, paycheckDate, cycleType, proStatusSettled]);

  return null;
}
