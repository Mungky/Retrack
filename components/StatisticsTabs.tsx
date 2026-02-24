"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { FileText, TrendingUp, BarChart3, ArrowUpCircle, ArrowDownCircle, Lock } from "lucide-react";
import DateRangeFilter from "./DateRangeFilter";
import { filterTransactionsByRange, toDateOnly, type DateRangeKey } from "@/lib/date-range";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { usePremiumModal } from "@/stores/premiumModalStore";
import { normalizeTransactionType } from "@/lib/transaction-calc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
import type { Category, Transaction } from "@/types";

const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

interface StatisticsTabsProps {
  transactions: Transaction[];
  categories: Category[];
}

const TABS = [
  { id: "report" as const, label: "Report", icon: FileText },
  { id: "balance" as const, label: "Balance Trend", icon: TrendingUp },
  { id: "cashflow" as const, label: "Cash Flow", icon: BarChart3 },
];

const PRO_TABS: (typeof TABS)[number]["id"][] = ["balance", "cashflow"];

export default function StatisticsTabs({
  transactions,
  categories,
}: StatisticsTabsProps) {
  const { formatCurrency } = useCurrency();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const { open: openPremium } = usePremiumModal();
  const [dateRange, setDateRange] = useState<DateRangeKey>("this_month");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("report");

  const handleDateRangeChange = (range: DateRangeKey) => {
    if (!isPro && range !== "this_month") {
      openPremium();
      return;
    }
    setDateRange(range);
  };

  const filtered = useMemo(
    () => filterTransactionsByRange(transactions, dateRange),
    [transactions, dateRange]
  );

  const stats = useMemo(() => {
    const totalIncome = filtered
      .filter((t) => normalizeTransactionType(t.type) === "income")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpense = filtered
      .filter((t) => normalizeTransactionType(t.type) === "expense")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const netCash = totalIncome - totalExpense;

    const incomeByCat: Record<string, number> = {};
    const expenseByCat: Record<string, number> = {};
    filtered.forEach((t) => {
      const name = t.category?.name || categories.find((c) => c.id === t.category_id)?.name || "Other";
      if (normalizeTransactionType(t.type) === "income") {
        incomeByCat[name] = (incomeByCat[name] || 0) + Number(t.amount || 0);
      }
      if (normalizeTransactionType(t.type) === "expense") {
        expenseByCat[name] = (expenseByCat[name] || 0) + Number(t.amount || 0);
      }
    });

    const dailyIncome: Record<string, number> = {};
    const dailyExpense: Record<string, number> = {};
    filtered.forEach((t) => {
      const d = toDateOnly(t.date);
      if (normalizeTransactionType(t.type) === "income") {
        dailyIncome[d] = (dailyIncome[d] || 0) + Number(t.amount || 0);
      }
      if (normalizeTransactionType(t.type) === "expense") {
        dailyExpense[d] = (dailyExpense[d] || 0) + Number(t.amount || 0);
      }
    });

    const allDates = [...new Set([...Object.keys(dailyIncome), ...Object.keys(dailyExpense)])].sort();
    const dailySeriesData = allDates.map((d) => ({
      rawDate: d,
      date: new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      income: dailyIncome[d] || 0,
      expense: dailyExpense[d] || 0,
      net: (dailyIncome[d] || 0) - (dailyExpense[d] || 0),
    }));

    const incomeReport = Object.entries(incomeByCat)
      .map(([name, value]) => ({ name, value, pct: totalIncome ? (value / totalIncome) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
    const expenseReport = Object.entries(expenseByCat)
      .map(([name, value]) => ({ name, value, pct: totalExpense ? (value / totalExpense) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    const filteredTransactions = filtered
      .filter((t) => {
        const txType = normalizeTransactionType(t.type);
        return txType === "income" || txType === "expense";
      })
      .sort((a, b) => toDateOnly(b.date).localeCompare(toDateOnly(a.date)));

    return {
      totalIncome,
      totalExpense,
      netCash,
      filteredTransactions,
      incomeReport,
      expenseReport,
      dailySeriesData,
    };
  }, [filtered, categories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">Statistics</h1>
          <p className="text-white/60 text-sm">Your financial analysis</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeFilter
            value={isPro ? dateRange : "this_month"}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 p-1 fintech-card rounded-2xl">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isLocked = !isPro && PRO_TABS.includes(id);
          const handleClick = () => {
            if (isLocked) {
              openPremium();
              return;
            }
            setActiveTab(id);
          };
          return (
            <button
              key={id}
              onClick={handleClick}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-primary/20 text-primary"
                  : isLocked
                    ? "text-white/40 hover:text-white/60"
                    : "text-white/60 hover:text-white/80"
              }`}
            >
              {isLocked ? <Lock size={16} /> : <Icon size={18} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="fintech-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Income</p>
          <p className="text-xl font-semibold text-emerald-400">
            {formatCurrency(stats.totalIncome)}
          </p>
        </div>
        <div className="fintech-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Expense</p>
          <p className="text-xl font-semibold text-rose-400">
            {formatCurrency(stats.totalExpense)}
          </p>
        </div>
        <div className="fintech-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Net Cash</p>
          <p
            className={`text-xl font-semibold ${
              stats.netCash >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(stats.netCash)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "report" && (
          <div className="fintech-card p-6 space-y-6">
            <h3 className="font-playfair text-xl font-semibold text-white">Report</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
                  <ArrowUpCircle size={18} /> Income
                </h4>
                <div className="space-y-2">
                  {stats.incomeReport.length === 0 ? (
                    <p className="text-white/40 text-sm">No income data</p>
                  ) : (
                    stats.incomeReport.map((r) => {
                      const cat = categories.find((c) => c.name === r.name);
                      const catColor = cat?.color || "#10b981";
                      return (
                        <div
                          key={r.name}
                          className="flex items-center gap-4 py-2 border-b border-white/5"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${catColor}20` }}
                          >
                            <CategoryIconDisplay
                              icon={cat?.icon ?? null}
                              name={r.name}
                              size={20}
                              style={{ color: catColor }}
                            />
                          </div>
                          <span className="flex-1 text-white font-medium">{r.name}</span>
                          <span className="text-emerald-400 font-semibold">{formatCurrency(r.value)}</span>
                          <span className="text-white/60 text-sm w-12 text-right">{r.pct.toFixed(1)}%</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-rose-400 font-medium mb-3 flex items-center gap-2">
                  <ArrowDownCircle size={18} /> Expense
                </h4>
                <div className="space-y-2">
                  {stats.expenseReport.length === 0 ? (
                    <p className="text-white/40 text-sm">No expense data</p>
                  ) : (
                    stats.expenseReport.map((r) => {
                      const cat = categories.find((c) => c.name === r.name);
                      const catColor = cat?.color || "#f43f5e";
                      return (
                        <div
                          key={r.name}
                          className="flex items-center gap-4 py-2 border-b border-white/5"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${catColor}20` }}
                          >
                            <CategoryIconDisplay
                              icon={cat?.icon ?? null}
                              name={r.name}
                              size={20}
                              style={{ color: catColor }}
                            />
                          </div>
                          <span className="flex-1 text-white font-medium">{r.name}</span>
                          <span className="text-rose-400 font-semibold">{formatCurrency(r.value)}</span>
                          <span className="text-white/60 text-sm w-12 text-right">{r.pct.toFixed(1)}%</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "balance" && (
          <div className="space-y-6">
            <div className="fintech-card p-6">
              <h3 className="font-playfair text-xl font-semibold text-white mb-4">
                Income vs Expense Trend
              </h3>
              {stats.dailySeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={stats.dailySeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
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
                      tickFormatter={(v) =>
                        v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(24,26,37,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      formatter={(v: unknown, name: unknown) => [formatCurrency(Number(v)), String(name)]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10B981"
                      fill="url(#incomeGradient)"
                      strokeWidth={2}
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#F43F5E"
                      fill="url(#expenseGradient)"
                      strokeWidth={2}
                      name="Expense"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-white/40">No income/expense data</div>
              )}
            </div>

            <div className="fintech-card p-6">
              <h3 className="font-playfair text-xl font-semibold text-white mb-4">
                Transactions in Selected Range
              </h3>
              {stats.filteredTransactions.length === 0 ? (
                <p className="text-white/40 text-sm">No transactions in this date range</p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {stats.filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {transaction.category?.name || transaction.type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(transaction.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          normalizeTransactionType(transaction.type) === "income"
                            ? "text-emerald-400"
                            : normalizeTransactionType(transaction.type) === "expense"
                            ? "text-rose-400"
                            : "text-white"
                        }`}
                      >
                        {normalizeTransactionType(transaction.type) === "income"
                          ? "+"
                          : normalizeTransactionType(transaction.type) === "expense"
                          ? "-"
                          : ""}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "cashflow" && (
          <div className="fintech-card p-6">
            <h3 className="font-playfair text-xl font-semibold text-white mb-4">Cash Flow</h3>
            {stats.dailySeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.dailySeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(24,26,37,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    formatter={(v: unknown, name: unknown) => [formatCurrency(Number(v)), String(name)]}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-white/40">No cash flow data</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
