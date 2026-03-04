"use client";

import { useState, useEffect } from "react";

/**
 * Hook untuk mendeteksi status koneksi jaringan.
 * SSR-safe: diinisialisasi di client via useEffect.
 * @returns isOnline - true jika terhubung internet, false jika offline
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
