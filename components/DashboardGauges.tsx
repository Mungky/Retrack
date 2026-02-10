"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { DateRangeKey } from "@/lib/date-range";
import { filterTransactionsByRange } from "@/lib/date-range";
import { calculateTotals } from "@/lib/transaction-calc";
import type { Transaction, Wallet } from "@/types";

const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

interface DashboardGaugesProps {
  wallets: Wallet[];
  transactions: Transaction[];
  dateRange: DateRangeKey;
}

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const p = amount < 0 ? "-" : "";
  if (abs >= 1e9) return `${p}Rp ${(abs / 1e9).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1e6) return `${p}Rp ${(abs / 1e6).toFixed(1).replace(".", ",")} Jt`;
  if (abs >= 1e3) return `${p}Rp ${(abs / 1e3).toFixed(1).replace(".", ",")} Rb`;
  return `${p}Rp ${abs.toLocaleString("id-ID")}`;
}

/** Semi-circle gauge using PieChart */
function GaugeChart({
  value,
  max,
  color,
  label,
  valueLabel,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  valueLabel: string;
}) {
  const fillPct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const data = [
    { name: "filled", value: fillPct },
    { name: "empty", value: 100 - fillPct },
  ];

  return (
    <div className="fintech-card p-4 flex flex-col items-center">
      <p className="text-white/60 text-xs font-medium mb-2">{label}</p>
      <div className="w-full h-24 -mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="95%"
              stroke="none"
              paddingAngle={0}
            >
              <Cell key="filled" fill={color} fillOpacity={1} />
              <Cell key="empty" fill="rgba(255,255,255,0.08)" fillOpacity={1} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-white font-bold text-sm truncate w-full text-center">
        {valueLabel}
      </p>
    </div>
  );
}

export default function DashboardGauges({
  wallets,
  transactions,
  dateRange,
}: DashboardGaugesProps) {
  const { totalBalance, income, expense, cashFlow, spendingPct } = useMemo(() => {
    const filtered = filterTransactionsByRange(transactions, dateRange);
    const totalBalance = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
    const { income, expense, net: cashFlow } = calculateTotals(filtered);
    const budget = income || 1;
    const spendingPct = Math.min(100, (expense / budget) * 100);
    return { totalBalance, income, expense, cashFlow, spendingPct };
  }, [wallets, transactions, dateRange]);

  const projectedBalance = totalBalance + Math.max(0, cashFlow);
  const balanceMax = Math.max(projectedBalance, totalBalance, 1);
  const cashFlowScale = Math.max(income, expense, Math.abs(cashFlow), 1);
  const cashFlowPct = Math.max(0, Math.min(100, ((cashFlow + cashFlowScale) / (2 * cashFlowScale)) * 100));

  return (
    <div className="grid grid-cols-3 gap-3">
      <GaugeChart
        value={totalBalance}
        max={balanceMax}
        color="#10B981"
        label="Balance vs Projected"
        valueLabel={formatCompact(totalBalance)}
      />
      <GaugeChart
        value={cashFlowPct}
        max={100}
        color="#3B82F6"
        label="Cash Flow"
        valueLabel={(cashFlow >= 0 ? "+" : "") + formatCompact(cashFlow)}
      />
      <GaugeChart
        value={spendingPct}
        max={100}
        color="#EF4444"
        label="Spending vs Budget"
        valueLabel={`${spendingPct.toFixed(0)}%`}
      />
    </div>
  );
}
