"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import TransactionItem from "./TransactionItem";
import type { Transaction } from "@/types";

function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: { [key: string]: Transaction[] } = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    const transactionDateOnly = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate()
    );

    let groupKey: string;
    if (transactionDateOnly.getTime() === today.getTime()) {
      groupKey = "Hari Ini";
    } else if (transactionDateOnly.getTime() === yesterday.getTime()) {
      groupKey = "Kemarin";
    } else {
      groupKey = transactionDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(transaction);
  });

  return groups;
}

export default function TransactionsList({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return initialTransactions;
    const query = searchQuery.toLowerCase();
    return initialTransactions.filter((transaction) => {
      const categoryName = transaction.category?.name?.toLowerCase() || "";
      const sourceWalletName = transaction.source_wallet?.name?.toLowerCase() || "";
      const destinationWalletName = transaction.destination_wallet?.name?.toLowerCase() || "";
      const amount = transaction.amount.toString();
      return (
        categoryName.includes(query) ||
        sourceWalletName.includes(query) ||
        destinationWalletName.includes(query) ||
        amount.includes(query)
      );
    });
  }, [initialTransactions, searchQuery]);

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  );

  if (initialTransactions.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-white/60 text-lg">Belum ada transaksi</p>
        <p className="text-white/40 text-sm mt-2">
          Mulai tambahkan transaksi untuk melihat riwayat di sini
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search - Glass style */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari transaksi..."
          className="w-full pl-12 pr-10 py-4 rounded-2xl glass-card border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30 focus:ring-2 focus:ring-cyan-500/20 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="text-white/60" size={18} />
          </button>
        )}
      </div>

      {/* Transactions - Single glass container, clean rows */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/60">Tidak ada transaksi yang ditemukan</p>
        </div>
      ) : (
        <div className="space-y-6 pb-32">
          {(() => {
            const allTransactions = Object.values(groupedTransactions).flat();
            const lastTransactionId =
              allTransactions.length > 0
                ? allTransactions[allTransactions.length - 1]?.id
                : null;

            return Object.entries(groupedTransactions).map(([dateGroup, groupTransactions]) => (
              <div key={dateGroup}>
                <h2 className="text-lg font-bold text-white mb-3">{dateGroup}</h2>
                <div className="glass-card px-4 overflow-visible">
                  {groupTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      isLastItem={transaction.id === lastTransactionId}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
