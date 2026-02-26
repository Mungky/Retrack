"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calculateTotals, isExpense, isIncome } from "@/lib/transaction-calc";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";
import type { Category, Transaction } from "@/types";

const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
interface StatisticsClientProps {
  transactions: Transaction[];
  categories: Category[];
}

const EMERALD = "#10B981";
const EMERALD_400 = "#34d399";

/** Expense category -> warm/vivid colors (untuk pengeluaran — no green!) */
function getExpenseCategoryColor(categoryName: string): string {
  const n = categoryName.toLowerCase();
  if (n.includes("food") || n.includes("makanan") || n.includes("restaurant") || n.includes("makan")) return "#F97316";
  if (n.includes("transport") || n.includes("mobil") || n.includes("bensin") || n.includes("ojek")) return "#3B82F6";
  if (n.includes("entertainment") || n.includes("hiburan") || n.includes("game")) return "#8B5CF6";
  if (n.includes("bills") || n.includes("tagihan") || n.includes("listrik") || n.includes("air")) return "#F59E0B";
  if (n.includes("shopping") || n.includes("belanja")) return "#EC4899";
  if (n.includes("health") || n.includes("kesehatan")) return "#EF4444";
  if (n.includes("education") || n.includes("pendidikan")) return "#06B6D4";
  if (n.includes("coffee") || n.includes("kopi") || n.includes("cafe")) return "#D97706";
  if (n.includes("travel") || n.includes("perjalanan") || n.includes("trip")) return "#0EA5E9";
  if (n.includes("work") || n.includes("kerja")) return "#6366F1";
  return "#94A3B8";
}

/** Income category -> green shades (untuk pemasukan) */
const INCOME_COLORS = ["#10B981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5", "#059669", "#047857", "#065f46"];

/** Custom Glass Tooltip for charts */
function ChartTooltip({
  active,
  payload,
  label,
  formatCurrency,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatCurrency: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-bg px-4 py-3 rounded-xl bg-[#181A25]/95 backdrop-blur-xl border border-white/10 shadow-xl">
      {label && <p className="text-white/60 text-xs mb-1">{label}</p>}
      <p className="text-white font-semibold">{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

/** Custom Tooltip for Donut - Category & % */
function CategoryTooltip({
  active,
  payload,
  total,
  isIncome,
  formatCurrency,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name: string; value: number }>;
  total?: number;
  isIncome?: boolean;
  formatCurrency: (n: number) => string;
}) {
  if (!active || !payload?.length || !total) return null;
  const item = payload[0];
  const percent = (item.value / total) * 100;
  return (
    <div className="chart-tooltip-bg px-4 py-3 rounded-xl bg-[#181A25]/95 backdrop-blur-xl border border-white/10 shadow-xl">
      <p className="text-white font-semibold">{item.name}</p>
      <p className={`text-sm ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
        {percent.toFixed(1)}% · {formatCurrency(item.value)}
      </p>
    </div>
  );
}

export default function StatisticsClient({
  transactions,
  categories,
}: StatisticsClientProps) {
  const stats = useMemo(() => {
    const { income, expense, net } = calculateTotals(transactions);

    const dailyExpenses: { [key: string]: number } = {};
    transactions
      .filter((t) => isExpense(t))
      .forEach((t) => {
        const date = new Date(t.date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        dailyExpenses[date] = (dailyExpenses[date] || 0) + t.amount;
      });

    const chartData = Object.entries(dailyExpenses)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => {
        try {
          const [dayA, monA] = a.date.split(" ");
          const [dayB, monB] = b.date.split(" ");
          const dateA = new Date(`${monA} ${dayA}`);
          const dateB = new Date(`${monB} ${dayB}`);
          return dateA.getTime() - dateB.getTime();
        } catch {
          return 0;
        }
      })
      .slice(-14);

    const categoryExpenses: { [key: string]: number } = {};
    transactions
      .filter((t) => isExpense(t) && t.category_id)
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        const categoryName = category?.name || "Other";
        categoryExpenses[categoryName] =
          (categoryExpenses[categoryName] || 0) + t.amount;
      });

    const categoryIncome: { [key: string]: number } = {};
    transactions
      .filter((t) => isIncome(t) && t.category_id)
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        const categoryName = category?.name || "Other";
        categoryIncome[categoryName] =
          (categoryIncome[categoryName] || 0) + t.amount;
      });

    const expenseCategoryData = Object.entries(categoryExpenses)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const incomeCategoryData = Object.entries(categoryIncome)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return { income, expense, net, chartData, expenseCategoryData, incomeCategoryData };
  }, [transactions, categories]);

  return (
    <div className="space-y-6">
      {/* 1. NET CASH SUMMARY CARDS - compact format, full number in tooltip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="fintech-card p-4" title={formatCurrency(stats.income)}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="text-emerald-400" size={18} />
            <span className="text-xs text-white/60 font-medium">Income</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white truncate">
            {formatCurrencyCompact(stats.income)}
          </p>
        </div>
        <div className="fintech-card p-4" title={formatCurrency(stats.expense)}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="text-rose-400" size={18} />
            <span className="text-xs text-white/60 font-medium">Expense</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white truncate">
            {formatCurrencyCompact(stats.expense)}
          </p>
        </div>
        <div
          className={`fintech-card p-4 ${
            stats.net >= 0
              ? "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          }`}
          title={formatCurrency(stats.net)}
        >
          <div className="flex items-center gap-2 mb-1">
            <Minus className={stats.net >= 0 ? "text-emerald-400" : "text-rose-400"} size={18} />
            <span className="text-xs text-white/60 font-medium">Net Cash</span>
          </div>
          <p
            className={`text-lg sm:text-xl font-bold truncate ${
              stats.net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {stats.net >= 0 ? "+" : ""}
            {formatCurrencyCompact(stats.net)}
          </p>
        </div>
      </div>

      {/* 2. SPENDING TREND - Area Chart with gradient */}
      <div className="fintech-card p-6">
        <h3 className="font-playfair text-xl font-semibold text-white mb-4">
          Spending Trend
        </h3>
        {stats.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD_400} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.08)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v)}
              />
              <Tooltip content={(props) => <ChartTooltip {...props as any} formatCurrency={formatCurrency} />} />
              <Area
                type="natural"
                dataKey="amount"
                stroke={EMERALD}
                strokeWidth={2}
                fill="url(#emeraldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-white/40">
            No spending data yet
          </div>
        )}
      </div>

      {/* 3. PEMASUKAN PER KATEGORI */}
      <div className="fintech-card p-6">
        <h3 className="font-playfair text-xl font-semibold text-white mb-1">
          Income by Category
        </h3>
        <p className="text-white/50 text-sm mb-4">Your income sources</p>
        {stats.incomeCategoryData.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Tooltip
                  content={(props) => (
                    <CategoryTooltip
                      {...props}
                      total={stats.incomeCategoryData.reduce((s, d) => s + d.value, 0)}
                      isIncome={true}
                      formatCurrency={formatCurrency}
                    />
                  )}
                />
                <Pie
                  data={stats.incomeCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="90%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.incomeCategoryData.map((d, i) => (
                    <Cell key={i} fill={INCOME_COLORS[i % INCOME_COLORS.length]} fillOpacity={1} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full grid grid-cols-2 gap-2">
              {stats.incomeCategoryData.slice(0, 6).map((d) => {
                const total = stats.incomeCategoryData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={d.name} className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/80 text-sm truncate">{d.name}</span>
                    <span className="text-emerald-400 text-sm font-medium">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-white/40 text-sm">
            No income data yet
          </div>
        )}
      </div>

      {/* 4. PENGELUARAN PER KATEGORI */}
      <div className="fintech-card p-6">
        <h3 className="font-playfair text-xl font-semibold text-white mb-1">
          Expense by Category
        </h3>
        <p className="text-white/50 text-sm mb-4">Your expense sources</p>
        {stats.expenseCategoryData.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Tooltip
                  content={(props) => (
                    <CategoryTooltip
                      {...props}
                      total={stats.expenseCategoryData.reduce((s, d) => s + d.value, 0)}
                      isIncome={false}
                      formatCurrency={formatCurrency}
                    />
                  )}
                />
                <Pie
                  data={stats.expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="90%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.expenseCategoryData.map((d, i) => (
                    <Cell key={i} fill={getExpenseCategoryColor(d.name)} fillOpacity={1} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full grid grid-cols-2 gap-2">
              {stats.expenseCategoryData.slice(0, 6).map((d) => {
                const total = stats.expenseCategoryData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={d.name} className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/80 text-sm truncate">{d.name}</span>
                    <span className="text-rose-400 text-sm font-medium">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-white/40 text-sm">
            Belum ada data pengeluaran
          </div>
        )}
      </div>

      {stats.chartData.length === 0 &&
        stats.incomeCategoryData.length === 0 &&
        stats.expenseCategoryData.length === 0 && (
          <div className="fintech-card p-12 text-center">
            <p className="text-white/50">Belum ada data untuk ditampilkan</p>
          </div>
        )}
    </div>
  );
}
