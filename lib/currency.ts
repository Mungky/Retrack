/**
 * Currency formatting utilities - centralized IDR formatting.
 */

/** Format IDR with full digits (e.g. Rp 1.234.567) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact format for UI (e.g. Rp 1,2 Jt, Rp 500 Rb, Rp 1,5 M) */
export function formatCurrencyCompact(amount: number): string {
  const absAmount = Math.abs(amount);
  const prefix = amount < 0 ? "-Rp " : "Rp ";
  if (absAmount >= 1_000_000_000) {
    const val = (absAmount / 1_000_000_000).toFixed(1).replace(".", ",");
    return `${prefix}${val} M`;
  }
  if (absAmount >= 1_000_000) {
    const val = (absAmount / 1_000_000).toFixed(1).replace(".", ",");
    return `${prefix}${val} Jt`;
  }
  if (absAmount >= 1_000) {
    const val = (absAmount / 1_000).toFixed(1).replace(".", ",");
    return `${prefix}${val} Rb`;
  }
  return `${prefix}${absAmount.toLocaleString("id-ID")}`;
}

/** Full format for tooltips - same as formatCurrency */
export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
