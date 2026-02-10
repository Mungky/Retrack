"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TransactionItem from "./TransactionItem";
import type { Transaction } from "@/types";

interface RecentTransactionsSectionProps {
  transactions: Transaction[];
}

export default function RecentTransactionsSection({
  transactions,
}: RecentTransactionsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-cyan-400 transition-colors"
        >
          See All
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="fintech-card rounded-3xl overflow-hidden border border-white/5">
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/50">No transactions yet</p>
            <p className="text-white/30 text-sm mt-1">
              Add your first transaction above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 pb-24">
            {transactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isLastItem={index === transactions.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
