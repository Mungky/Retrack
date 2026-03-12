"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { filterTransactionsByRange, getDatesInRange, type DateRangeKey } from "@/lib/date-range";
import { useCycleStore } from "@/stores/cycleStore";
import { calculateTotals, aggregateByDate, getCumulativeNetSeries } from "@/lib/transaction-calc";
import { formatCurrency, formatCurrencyCompact, formatCurrencyFull } from "@/lib/currency";
import type { Transaction } from "@/types";

const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

interface DashboardSummaryProps {
  transactions: Transaction[];
  dateRange: DateRangeKey;
}

function formatChartDate(isoDate: string): string {
  try {
    const [y, m, d] = isoDate.split("-");
    const month = new Date(Number(y), Number(m) - 1, 1).toLocaleString("id-ID", {
      month: "short",
    });
    return `${d} ${month}`;
  } catch {
    return isoDate;
  }
}

export default function DashboardSummary({
  transactions,
  dateRange,
}: DashboardSummaryProps) {
  const cycleType = useCycleStore((s) => s.cycleType);
  const paycheckDate = useCycleStore((s) => s.paycheckDate);
  const cycleParams = { cycleType, paycheckDate };

  const { income, expense, net } = useMemo(() => {
    const filtered = filterTransactionsByRange(transactions, dateRange, cycleParams);
    return calculateTotals(filtered);
  }, [transactions, dateRange, cycleType, paycheckDate]);

  const chartData = useMemo(() => {
    const filtered = filterTransactionsByRange(transactions, dateRange, cycleParams);
    const daily = aggregateByDate(filtered);
    const dates = getDatesInRange(dateRange, cycleParams);
    if (dates.length === 0) return [];
    const series = getCumulativeNetSeries(daily, dates);
    return series.map((d) => ({
      ...d,
      dateLabel: formatChartDate(d.date),
    }));
  }, [transactions, dateRange, cycleType, paycheckDate]);

  const chartColor = net >= 0 ? "#10B981" : "#F43F5E";

  return (
    <div className="space-y-3">
      {/* Income & Expense - top row */}
      <div className="grid grid-cols-2 gap-3">
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
      </div>

      {/* Net Flow Card - label/value di kiri, chart di kanan */}
      <div
        className="rounded-2xl bg-slate-900 p-4 border transition-all flex items-stretch gap-4"
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
        <div className="flex flex-col justify-center min-w-0 flex-shrink-0">
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

        {/* Mini preview chart - full chart ada di halaman Stats */}
        {chartData.length > 0 ? (
          <div className="flex-1 min-w-0 h-14 min-h-[56px]">
            <ResponsiveContainer width="100%" height={56} minHeight={56}>
              <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <XAxis dataKey="dateLabel" hide />
                <YAxis dataKey="cumulativeNet" hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15,23,42,0.98)",
                    border: "1px solid rgba(51,65,85,0.9)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: unknown) => formatCurrency(Number(value))}
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeNet"
                  stroke={chartColor}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 min-w-0 h-14 flex items-center justify-center text-white/40 text-xs">
            No data
          </div>
        )}
      </div>
    </div>
  );
}
