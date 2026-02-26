"use client";

import { formatCurrencyCompact, formatCurrencyFull } from "@/lib/currency";

interface DashboardCardProps {
  totalBalance: number;
}

export default function DashboardCard({ totalBalance }: DashboardCardProps) {
  const formatted = formatCurrencyCompact(totalBalance);
  // Scale font: longer strings = smaller font to prevent overflow
  const charCount = formatted.length;
  const fontSize =
    charCount > 14 ? "text-2xl" : charCount > 10 ? "text-3xl" : "text-4xl";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-900 p-6 min-h-[180px] flex flex-col justify-between">
      {/* Abstract decoration - subtle circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-8 w-16 h-16 bg-white/5 rounded-full" />

      <div className="relative z-10">
        <p className="text-white/80 text-sm font-medium mb-4">Total Balance</p>
        <p
          className={`${fontSize} font-bold text-white leading-tight truncate`}
          style={{ maxWidth: "100%" }}
          title={formatCurrencyFull(totalBalance)}
        >
          {formatted}
        </p>
      </div>
    </div>
  );
}
