"use client";

import { useState, useMemo } from "react";
import DateRangeFilter from "./DateRangeFilter";
import BalanceCard from "./BalanceCard";
import DashboardWallets from "./DashboardWallets";
import DashboardSummary from "./DashboardSummary";
import QuickActionsRow from "./QuickActionsRow";
import type { DateRangeKey } from "@/lib/date-range";
import type { Transaction, Wallet } from "@/types";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { usePremiumModal } from "@/stores/premiumModalStore";
import { useOptimisticTransactionStore } from "@/stores/optimisticTransactionStore";

interface DashboardClientProps {
  wallets: Wallet[];
  transactions: Transaction[];
}

export default function DashboardClient({
  wallets,
  transactions,
}: DashboardClientProps) {
  const [dateRange, setDateRange] = useState<DateRangeKey>("this_month");
  const isPro = useSubscriptionStore((s) => s.isPro);
  const { open: openPremium } = usePremiumModal();
  const { transactions: optimisticTx, walletDeltas } = useOptimisticTransactionStore();

  const mergedTransactions = useMemo(() => {
    const all = [...transactions, ...(optimisticTx as Transaction[])];
    return all.sort((a, b) => {
      const da = a.date?.split?.("T")[0] ?? a.date;
      const db = b.date?.split?.("T")[0] ?? b.date;
      return db.localeCompare(da);
    });
  }, [transactions, optimisticTx]);

  const totalBalance = useMemo(() => {
    const serverTotal = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
    const deltaTotal = Object.values(walletDeltas).reduce((s, d) => s + d, 0);
    return serverTotal + deltaTotal;
  }, [wallets, walletDeltas]);

  const handleDateRangeChange = (range: DateRangeKey) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-white/60 text-sm">
            Here&apos;s your financial overview
          </p>
        </div>
        <DateRangeFilter
          value={dateRange}
          onChange={handleDateRangeChange}
        />
      </div>

      <div className="space-y-6">
        {/* Purple Balance Card with User Profile (includes optimistic updates) */}
        <BalanceCard totalBalance={totalBalance} />

        {/* Status Widgets - Income, Expense, Net Flow (includes optimistic txs) */}
        <DashboardSummary
          transactions={mergedTransactions}
          dateRange={dateRange}
        />

        <QuickActionsRow />

        {/* Wallet list - saldo per wallet (full format, no rb/jt/mil) */}
        <DashboardWallets wallets={wallets} walletDeltas={walletDeltas} />
      </div>
    </div>
  );
}
