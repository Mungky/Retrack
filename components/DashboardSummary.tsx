"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { filterTransactionsByRange, type DateRangeKey } from "@/lib/date-range";
import { calculateTotals } from "@/lib/transaction-calc";
import type { Transaction } from "@/types";

interface DashboardSummaryProps {
  transactions: Transaction[];
  dateRange: DateRangeKey;
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyCompact(amount: number): string {
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

export default function DashboardSummary({
  transactions,
  dateRange,
}: DashboardSummaryProps) {
  const { income, expense, net } = useMemo(() => {
    const filtered = filterTransactionsByRange(transactions, dateRange);
    return calculateTotals(filtered);
  }, [transactions, dateRange]);

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Income Card - Emerald glow */}
      <div
        className="rounded-2xl bg-slate-900 p-4 border transition-all"
        style={{
          borderColor: "rgba(16, 185, 129, 0.4)",
          boxShadow: "0 0 20px rgba(16, 185, 129, 0.25)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="text-emerald-400" size={18} />
          <span className="text-xs text-white/70 font-medium">Income</span>
        </div>
        <p className="text-lg font-bold text-white truncate" title={formatCurrencyFull(income)}>
          {formatCurrencyCompact(income)}
        </p>
      </div>

      {/* Expense Card - Rose glow */}
      <div
        className="rounded-2xl bg-slate-900 p-4 border transition-all"
        style={{
          borderColor: "rgba(244, 63, 94, 0.4)",
          boxShadow: "0 0 20px rgba(244, 63, 94, 0.25)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="text-rose-400" size={18} />
          <span className="text-xs text-white/70 font-medium">Expense</span>
        </div>
        <p className="text-lg font-bold text-white truncate" title={formatCurrencyFull(expense)}>
          {formatCurrencyCompact(expense)}
        </p>
      </div>

      {/* Net Flow Card - Dynamic glow */}
      <div
        className="rounded-2xl bg-slate-900 p-4 border transition-all"
        style={
          net >= 0
            ? {
                borderColor: "rgba(16, 185, 129, 0.5)",
                boxShadow: "0 0 24px rgba(16, 185, 129, 0.4)",
              }
            : {
                borderColor: "rgba(244, 63, 94, 0.8)",
                boxShadow: "0 0 28px rgba(244, 63, 94, 0.6)",
              }
        }
      >
        <div className="flex items-center gap-2 mb-1">
          <Minus
            className={net >= 0 ? "text-emerald-400" : "text-rose-400"}
            size={18}
          />
          <span className="text-xs text-white/70 font-medium">Net Flow</span>
        </div>
        <p
          className={`text-lg font-bold truncate ${
            net >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
          title={formatCurrencyFull(net)}
        >
          {net >= 0 ? "+" : ""}
          {formatCurrencyCompact(net)}
        </p>
      </div>
    </div>
  );
}
