"use client";

import React from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { FormAccent } from "@/lib/form-themes";

const CURRENCY_SYMBOLS: Record<string, string> = { IDR: "Rp", USD: "$", EUR: "€" };

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  accent?: FormAccent;
  placeholder?: string;
}

const ACCENT_FOCUS: Record<FormAccent, string> = {
  emerald: "focus:ring-0 focus:border-b-primary focus:border-b-2",
  rose: "focus:ring-0 focus:border-b-primary focus:border-b-2",
  blue: "focus:ring-0 focus:border-b-primary focus:border-b-2",
  violet: "focus:ring-0 focus:border-b-primary focus:border-b-2",
  cyan: "focus:ring-0 focus:border-b-primary focus:border-b-2",
};

const ACCENT_PREFIX: Record<FormAccent, string> = {
  emerald: "text-emerald-400/50",
  rose: "text-rose-400/50",
  blue: "text-blue-400/50",
  violet: "text-violet-400/50",
  cyan: "text-cyan-400/50",
};

const INPUT_LOCALES: Record<string, string> = { IDR: "id-ID", USD: "en-US", EUR: "de-DE" };

/** Format a number for input display (locale-aware thousand separators) */
export function formatForInput(num: number, currency = "IDR"): string {
  if (!num) return "";
  const locale = INPUT_LOCALES[currency] ?? "id-ID";
  return new Intl.NumberFormat(locale).format(num);
}

/** Strip non-digits and parse to integer */
export function parseIDR(str: string): number {
  const raw = str.replace(/\D/g, "");
  return raw ? parseInt(raw, 10) : 0;
}

export default function CurrencyInput({
  value,
  onChange,
  disabled = false,
  accent = "cyan",
  placeholder = "0",
}: CurrencyInputProps) {
  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency] ?? "Rp";
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseIDR(e.target.value));
  };

  return (
    <div className="relative">
      <span
        className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold pointer-events-none select-none ${ACCENT_PREFIX[accent]}`}
      >
        {symbol}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value > 0 ? formatForInput(value, currency) : ""}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-none border-0 border-b-2 border-input bg-transparent pl-14 pr-4 py-3 text-2xl font-bold text-foreground focus:outline-none focus:ring-0 placeholder:text-muted-foreground disabled:opacity-50 transition-colors ${ACCENT_FOCUS[accent]}`}
      />
    </div>
  );
}
