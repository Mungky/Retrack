"use client";

import { useCallback } from "react";
import { lightTap as lightTapFn, mediumClick as mediumClickFn, successVibrate as successVibrateFn } from "@/lib/haptic";

/**
 * Hook returning haptic feedback functions.
 * Hanya panggil dari handler interaksi (onClick, onSubmit).
 * - lightTap: normal buttons (10ms)
 * - mediumClick: menu dial open (20ms)
 * - successVibrate: transaksi berhasil ([15, 30, 15])
 */
export function useHaptic() {
  const lightTap = useCallback(lightTapFn, []);
  const mediumClick = useCallback(mediumClickFn, []);
  const successVibrate = useCallback(successVibrateFn, []);

  return { lightTap, mediumClick, successVibrate };
}
