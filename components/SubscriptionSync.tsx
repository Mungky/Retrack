"use client";

import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { getProStatus } from "@/app/actions/subscription";

/**
 * Sinkronkan status Pro dari database ke store.
 * Source of Truth: database (users.is_pro).
 * Refetch: pada login dan saat tab/window mendapat fokus kembali.
 */
export function SubscriptionSync() {
  const { user } = useAuth();
  const setProStatus = useSubscriptionStore((s) => s.setProStatus);

  const sync = useCallback(() => {
    if (!user?.id) {
      setProStatus(false);
      return;
    }
    getProStatus().then(setProStatus);
  }, [user?.id, setProStatus]);

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
