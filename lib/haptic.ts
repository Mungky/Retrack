/**
 * Haptic feedback via navigator.vibrate().
 * Safe on unsupported devices (no-op when unavailable).
 * Hanya dipanggil dari handler interaksi user (onClick, onSubmit).
 * JANGAN panggil di useEffect atau body render.
 */

function vibratePattern(pattern: number | number[]): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // No-op: beberapa browser mobile bisa throw (mis. tanpa user gesture)
  }
}

/** Light tap - untuk klik tombol biasa (10ms) */
export function lightTap(): void {
  vibratePattern(10);
}

/** Medium click - untuk membuka menu (20ms) */
export function mediumClick(): void {
  vibratePattern(20);
}

/** Success pattern - untuk transaksi berhasil disimpan (15ms-pause-30ms-pause-15ms) */
export function successVibrate(): void {
  vibratePattern([15, 30, 15]);
}
