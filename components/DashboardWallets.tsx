"use client";

import { CreditCard, Smartphone, Wallet as WalletIcon } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import type { Wallet } from "@/types";

const getWalletIcon = (type: string) => {
  switch (type) {
    case "bank":
      return CreditCard;
    case "ewallet":
      return Smartphone;
    case "cash":
      return WalletIcon;
    default:
      return WalletIcon;
  }
};

interface DashboardWalletsProps {
  wallets: Wallet[];
  /** Per-wallet balance delta from optimistic transactions */
  walletDeltas: Record<string, number>;
}

export default function DashboardWallets({
  wallets,
  walletDeltas,
}: DashboardWalletsProps) {
  if (wallets.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Saldo per Wallet</h2>
        <Link
          href="/settings"
          className="text-sm text-primary hover:underline"
        >
          Kelola
        </Link>
      </div>
      <div className="space-y-2">
        {wallets.map((wallet) => {
          const Icon = getWalletIcon(wallet.type);
          const baseBalance = wallet.balance ?? 0;
          const delta = walletDeltas[wallet.id] ?? 0;
          const displayBalance = baseBalance + delta;

          return (
            <div
              key={wallet.id}
              className="flex items-center justify-between p-4 rounded-xl fintech-card border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <span className="font-medium text-foreground">{wallet.name}</span>
              </div>
              <p
                className="font-semibold text-foreground tabular-nums"
                title={formatCurrency(displayBalance)}
              >
                {formatCurrency(displayBalance)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
