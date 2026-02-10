"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { Category, Transaction } from "@/types";

// Dynamic import untuk recharts (code splitting - hanya load saat diperlukan)
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

interface StatisticsClientProps {
  transactions: Transaction[];
  categories: Category[];
}

const COLORS = ["#06b6d4", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

export default function StatisticsClient({
  transactions,
  categories,
}: StatisticsClientProps) {
  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;

    // Daily expense chart data
    const dailyExpenses: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === "expense")
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
        const dateA = new Date(a.date.split(" ")[1] + " " + a.date.split(" ")[0]);
        const dateB = new Date(b.date.split(" ")[1] + " " + b.date.split(" ")[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-7);

    // Category expense data
    const categoryExpenses: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === "expense" && t.category_id)
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        const categoryName = category?.name || "Lainnya";
        categoryExpenses[categoryName] =
          (categoryExpenses[categoryName] || 0) + t.amount;
      });

    const pieData = Object.entries(categoryExpenses)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Projected monthly expense
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const daysPassed = now.getDate();
    const projectedExpense =
      daysPassed > 0 ? (expense / daysPassed) * daysInMonth : 0;

    return {
      income,
      expense,
      net,
      chartData,
      pieData,
      projectedExpense,
    };
  }, [transactions, categories]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-emerald-400" size={20} />
            <p className="text-sm text-slate-400 font-semibold">Pemasukan</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.income)}
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-400" size={20} />
            <p className="text-sm text-slate-400 font-semibold">Pengeluaran</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.expense)}
          </p>
        </div>
      </div>

      {/* Projected Expense Warning */}
      <div className="rounded-2xl bg-gradient-to-br from-red-500/10 via-pink-500/10 to-red-600/10 border border-red-500/30 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-400 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-400 mb-1">
              Proyeksi Total Pengeluaran
            </h3>
            <p className="text-2xl font-bold text-white mb-2">
              {formatCurrency(stats.projectedExpense)}
            </p>
            <p className="text-sm text-red-300/80">
              Total uang yang akan habis jika gaya hidupmu tetap begini
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      {stats.chartData.length > 0 && (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Pengeluaran Harian (7 Hari Terakhir)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.chartData}>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                formatter={(value: any) => formatCurrency(Number(value) || 0)}
              />
              <Bar dataKey="amount" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.pieData.length > 0 && (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Pengeluaran per Kategori
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                formatter={(value: any) => formatCurrency(Number(value) || 0)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.chartData.length === 0 && stats.pieData.length === 0 && (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-12 text-center">
          <p className="text-slate-400">Belum ada data untuk ditampilkan</p>
        </div>
      )}
    </div>
  );
}
