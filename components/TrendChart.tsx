"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/currency";

const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

export interface TrendPoint {
  date: string;
  income: number;
  expense: number;
}

interface TrendChartProps {
  data: TrendPoint[];
}

function formatChartDate(isoDate: string): string {
  try {
    const [y, m, d] = isoDate.split("-");
    const month = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en", {
      month: "short",
    });
    return `${d} ${month}`;
  } catch {
    return isoDate;
  }
}

export default function TrendChart({ data }: TrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatChartDate(d.date),
  }));

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Income vs Expense Trend</h3>
      {chartData.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-slate-400">
          No data in selected period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.98)",
                border: "1px solid rgba(51,65,85,0.9)",
                borderRadius: "10px",
              }}
              formatter={(value: unknown, name: unknown) => [
                formatCurrency(Number(value)),
                String(name),
              ]}
            />
            <Legend />
            <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2} fill="url(#incomeFill)" />
            <Area type="monotone" dataKey="expense" name="Expense" stroke="#F43F5E" strokeWidth={2} fill="url(#expenseFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
