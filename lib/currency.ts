/**
 * Currency formatting utilities - supports IDR, USD, EUR.
 * Use CurrencyContext for user-selectable currency.
 */

export type CurrencyOption = "IDR" | "USD" | "EUR";

const CURRENCY_CONFIG: Record<
  CurrencyOption,
  { locale: string; currency: string; symbol: string; compact: { K: string; M: string; B: string } }
> = {
  IDR: { locale: "id-ID", currency: "IDR", symbol: "Rp", compact: { K: "Rb", M: "Jt", B: "M" } },
  USD: { locale: "en-US", currency: "USD", symbol: "$", compact: { K: "K", M: "M", B: "B" } },
  EUR: { locale: "de-DE", currency: "EUR", symbol: "€", compact: { K: "K", M: "M", B: "B" } },
};

const DEFAULT_CURRENCY: CurrencyOption = "IDR";

/** Format with full digits (e.g. Rp 1.234.567 or $1,234.57) */
export function formatCurrency(amount: number, option: CurrencyOption = DEFAULT_CURRENCY): string {
  const config = CURRENCY_CONFIG[option];
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: option === "IDR" ? 0 : 2,
    maximumFractionDigits: option === "IDR" ? 0 : 2,
  }).format(amount);
}

/** Compact format for UI (e.g. Rp 1,2 Jt, $1.2M) */
export function formatCurrencyCompact(amount: number, option: CurrencyOption = DEFAULT_CURRENCY): string {
  const config = CURRENCY_CONFIG[option];
  const absAmount = Math.abs(amount);
  const prefix = amount < 0 ? `-${config.symbol} ` : `${config.symbol} `;
  const { K, M, B } = config.compact;
  if (absAmount >= 1_000_000_000) {
    const val = (absAmount / 1_000_000_000).toFixed(1).replace(".", option === "IDR" ? "," : ".");
    return `${prefix}${val} ${B}`;
  }
  if (absAmount >= 1_000_000) {
    const val = (absAmount / 1_000_000).toFixed(1).replace(".", option === "IDR" ? "," : ".");
    return `${prefix}${val} ${M}`;
  }
  if (absAmount >= 1_000) {
    const val = (absAmount / 1_000).toFixed(1).replace(".", option === "IDR" ? "," : ".");
    return `${prefix}${val} ${K}`;
  }
  return `${prefix}${absAmount.toLocaleString(config.locale)}`;
}

/** Full format for tooltips - same as formatCurrency */
export function formatCurrencyFull(amount: number, option: CurrencyOption = DEFAULT_CURRENCY): string {
  const config = CURRENCY_CONFIG[option];
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: option === "IDR" ? 0 : 2,
    maximumFractionDigits: option === "IDR" ? 0 : 2,
  }).format(amount);
}
