"use client";

import { useState, useMemo } from "react";
import DateRangeFilter from "./DateRangeFilter";
import StatsCards from "./StatsCards";
import TrendChart, { type TrendPoint } from "./TrendChart";
import CategoryChart from "./CategoryChart";
import { filterTransactionsByRange, type DateRangeKey } from "@/lib/date-range";
import {
  calculateTotals,
  aggregateByDate,
  aggregateExpenseByCategory,
  aggregateIncomeByCategory,
  type CategoryPoint,
} from "@/lib/transaction-calc";

type TransactionRow = {
  id: string;
  amount: number;
  type: string;
  date: string;
  category_id: string | null;
  category?: { id?: string; name?: string | null } | null;
  categories?:
    | { id?: string; name?: string | null }
    | { id?: string; name?: string | null }[]
    | null;
};

function getCategoryName(tx: TransactionRow): string {
  const cat = tx.category ?? (Array.isArray(tx.categories) ? tx.categories[0] : tx.categories);
  return cat?.name ?? "Uncategorized";
}

interface StatsClientProps {
  transactions: TransactionRow[];
}

export default function StatsClient({ transactions }: StatsClientProps) {
  const [dateRange, setDateRange] = useState<DateRangeKey>("this_month");

  const filtered = useMemo(
    () => filterTransactionsByRange(transactions, dateRange),
    [transactions, dateRange]
  );

  const { income, expense, net: netCash } = useMemo(
    () => calculateTotals(filtered),
    [filtered]
  );

  const trendData: TrendPoint[] = useMemo(() => aggregateByDate(filtered), [filtered]);

  const expenseCategoryData: CategoryPoint[] = useMemo(
    () =>
      aggregateExpenseByCategory(filtered, (id) => {
        if (!id) return "Uncategorized";
        const tx = filtered.find((t) => t.category_id === id);
        return tx ? getCategoryName(tx) : "Uncategorized";
      }),
    [filtered]
  );

  const incomeCategoryData: CategoryPoint[] = useMemo(
    () =>
      aggregateIncomeByCategory(filtered, (id) => {
        if (!id) return "Uncategorized";
        const tx = filtered.find((t) => t.category_id === id);
        return tx ? getCategoryName(tx) : "Uncategorized";
      }),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Stats</h1>
          <p className="text-slate-400 text-sm">
            Real-time analytics for selected period
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <StatsCards income={income} expense={expense} netCash={netCash} />
      <TrendChart data={trendData} />
      <CategoryChart
        data={incomeCategoryData}
        title="Income by Category"
        subtitle="Sources of income"
        variant="income"
      />
      <CategoryChart
        data={expenseCategoryData}
        title="Expense by Category"
        subtitle="Current period expenses"
        variant="expense"
      />
    </div>
  );
}
