"use client";

import React from "react";
import type { FormAccent } from "@/lib/form-themes";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  accent?: FormAccent;
  placeholder?: string;
}

const ACCENT_FOCUS: Record<FormAccent, string> = {
  emerald: "focus:ring-emerald-500/30 focus:border-emerald-500/50",
  rose: "focus:ring-rose-500/30 focus:border-rose-500/50",
  blue: "focus:ring-blue-500/30 focus:border-blue-500/50",
  violet: "focus:ring-violet-500/30 focus:border-violet-500/50",
  cyan: "focus:ring-cyan-500/30 focus:border-cyan-500/50",
};

const ACCENT_PREFIX: Record<FormAccent, string> = {
  emerald: "text-emerald-400/50",
  rose: "text-rose-400/50",
  blue: "text-blue-400/50",
  violet: "text-violet-400/50",
  cyan: "text-cyan-400/50",
};

/** Format a number into Indonesian locale (e.g. 100000 → "100.000") */
export function formatIDR(num: number): string {
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(num);
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseIDR(e.target.value));
  };

  return (
    <div className="relative">
      <span
        className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold pointer-events-none select-none ${ACCENT_PREFIX[accent]}`}
      >
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value > 0 ? formatIDR(value) : ""}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full pl-14 pr-4 py-4 text-2xl font-bold text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 transition-all placeholder:text-white/20 disabled:opacity-50 ${ACCENT_FOCUS[accent]}`}
      />
    </div>
  );
}
