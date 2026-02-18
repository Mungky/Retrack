"use client";

import dynamic from "next/dynamic";
import { useCurrency } from "@/contexts/CurrencyContext";

const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

export interface CategoryPoint {
  name: string;
  value: number;
}

interface CategoryChartProps {
  data: CategoryPoint[];
  title?: string;
  subtitle?: string;
  /** "income" = Emerald/green shades | "expense" = Rose/amber shades */
  variant?: "income" | "expense";
}

const EXPENSE_COLORS = ["#F43F5E", "#FB7185", "#E11D48", "#BE123C", "#9F1239", "#881337"];
const INCOME_COLORS = ["#10B981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669", "#047857"];

export default function CategoryChart({
  data,
  title = "Expense by Category",
  subtitle = "Current period expenses",
  variant = "expense",
}: CategoryChartProps) {
  const { formatCurrency } = useCurrency();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = variant === "income" ? INCOME_COLORS : EXPENSE_COLORS;
  const emptyMsg =
    variant === "income"
      ? "No income data in selected period"
      : "No expense data in selected period";

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{subtitle}</p>

      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-slate-400">
          {emptyMsg}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-1/2 space-y-2">
            {data.map((item, idx) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    />
                    <span className="text-sm text-slate-200 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
