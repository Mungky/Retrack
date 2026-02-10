"use client";

import { useState } from "react";
import DateRangeFilter from "./DateRangeFilter";
import BalanceCard from "./BalanceCard";
import DashboardSummary from "./DashboardSummary";
import QuickActionsRow from "./QuickActionsRow";
import WalletManagement from "./WalletManagement";
import NotificationsBadge from "./NotificationsBadge";
import type { DateRangeKey } from "@/lib/date-range";
import type { Transaction, Wallet } from "@/types";

interface DashboardClientProps {
  wallets: Wallet[];
  transactions: Transaction[];
}

export default function DashboardClient({
  wallets,
  transactions,
}: DashboardClientProps) {
  const [dateRange, setDateRange] = useState<DateRangeKey>("this_month");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-white/60 text-sm">
            Here&apos;s your financial overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <NotificationsBadge />
        </div>
      </div>

      <div className="space-y-6">
        {/* Purple Balance Card with User Profile */}
        <BalanceCard
          totalBalance={wallets.reduce((s, w) => s + (w.balance ?? 0), 0)}
        />

        {/* Status Widgets - Income, Expense, Net Flow with glow borders */}
        <DashboardSummary
          transactions={transactions}
          dateRange={dateRange}
        />

        <QuickActionsRow />

        <div className="mt-8">
          <WalletManagement initialWallets={wallets} />
        </div>
      </div>
    </div>
  );
}
