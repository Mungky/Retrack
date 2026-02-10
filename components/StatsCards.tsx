"use client";

interface StatsCardsProps {
  income: number;
  expense: number;
  netCash: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function StatsCards({ income, expense, netCash }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card">
        <p className="text-sm text-slate-400 mb-1">Total Income</p>
        <p className="text-xl font-semibold text-emerald-400" title={formatCurrency(income)}>
          {formatCurrency(income)}
        </p>
      </div>
      <div className="card">
        <p className="text-sm text-slate-400 mb-1">Total Expense</p>
        <p className="text-xl font-semibold text-rose-400" title={formatCurrency(expense)}>
          {formatCurrency(expense)}
        </p>
      </div>
      <div className="card">
        <p className="text-sm text-slate-400 mb-1">Net Cash</p>
        <p
          className={`text-xl font-semibold ${netCash >= 0 ? "text-emerald-400" : "text-rose-400"}`}
          title={formatCurrency(netCash)}
        >
          {formatCurrency(netCash)}
        </p>
      </div>
    </div>
  );
}
