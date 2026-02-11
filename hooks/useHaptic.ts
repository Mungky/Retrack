"use client";

import { useCallback } from "react";
import { lightTap as lightTapFn, mediumClick as mediumClickFn, heavyThud as heavyThudFn } from "@/lib/haptic";

/**
 * Hook returning haptic feedback functions.
 * - lightTap: normal buttons (10ms)
 * - mediumClick: menu dial open (20ms)
 * - heavyThud: success/error (40ms)
 */
export function useHaptic() {
  const lightTap = useCallback(lightTapFn, []);
  const mediumClick = useCallback(mediumClickFn, []);
  const heavyThud = useCallback(heavyThudFn, []);

  return { lightTap, mediumClick, heavyThud };
}
