"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/cn";
import type { CurrencyOption } from "@/lib/currency";

const CURRENCIES: { value: CurrencyOption; label: string; symbol: string }[] = [
  { value: "IDR", label: "IDR", symbol: "Rp" },
  { value: "USD", label: "USD", symbol: "$" },
  { value: "EUR", label: "EUR", symbol: "€" },
];

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Currency Symbol</p>
      <div className="rounded-xl bg-card p-3 border border-border" data-currency-symbol-bg>
        <div className="grid grid-cols-3 gap-3">
        {CURRENCIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCurrency(c.value)}
            className={cn(
              "relative flex flex-col items-center gap-1 p-3 rounded-xl border-0 border-t-2 transition-all",
              "hover:scale-[1.02] active:scale-[0.98]",
              currency === c.value
                ? "border-t-primary bg-primary/10"
                : "border-t-border/50 bg-card hover:border-t-primary/50"
            )}
          >
            <span
              className={cn(
                "text-xl font-bold",
                currency === c.value ? "text-primary" : "text-muted-foreground"
              )}
            >
              {c.symbol}
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                currency === c.value ? "text-primary" : "text-muted-foreground"
              )}
            >
              {c.label}
            </span>
            {currency === c.value && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
