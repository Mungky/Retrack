/**
 * Haptic feedback via navigator.vibrate().
 * Safe on unsupported devices (no-op when unavailable).
 */

function vibrate(duration: number): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

/** Light tap - for normal buttons (10ms) */
export function lightTap(): void {
  vibrate(10);
}

/** Medium click - for opening menu dial (20ms) */
export function mediumClick(): void {
  vibrate(20);
}

/** Heavy thud - for success/error states (40ms) */
export function heavyThud(): void {
  vibrate(40);
}
