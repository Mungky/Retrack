"use client";

import { useRouter } from "next/navigation";
import { Plus, Minus, ArrowRightLeft, Wallet as WalletIcon } from "lucide-react";
import AddTransactionSheet from "./AddTransactionSheet";
import WalletFormSheet from "./WalletFormSheet";
import QuickTransferSheet from "./QuickTransferSheet";
import { useSheet } from "@/contexts/SheetContext";
import { useState } from "react";
import type { Wallet } from "@/types";

const actions = [
  {
    label: "Income",
    icon: Plus,
    color: "bg-emerald-500/20 text-emerald-400",
    handler: "income",
  },
  {
    label: "Expense",
    icon: Minus,
    color: "bg-rose-500/20 text-rose-400",
    handler: "expense",
  },
  {
    label: "Transfer",
    icon: ArrowRightLeft,
    color: "bg-blue-500/20 text-blue-400",
    handler: "transfer",
  },
  {
    label: "Add Wallet",
    icon: WalletIcon,
    color: "bg-slate-500/20 text-slate-400",
    handler: "wallet",
  },
];

export default function QuickActionsRow() {
  const router = useRouter();
  const { setIsSheetOpen } = useSheet();
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const handleClick = (handler: string) => {
    setIsSheetOpen(true);
    if (handler === "income") setIncomeOpen(true);
    else if (handler === "expense") setExpenseOpen(true);
    else if (handler === "transfer") setTransferOpen(true);
    else if (handler === "wallet") setWalletOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setIncomeOpen(false);
    setExpenseOpen(false);
    setTransferOpen(false);
    setWalletOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 py-2">
        {actions.map(({ label, icon: Icon, color, handler }) => (
          <button
            key={handler}
            onClick={() => handleClick(handler)}
            className="flex flex-col items-center gap-2 flex-1"
          >
            <div
              className={`w-14 h-14 rounded-full ${color} flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
            >
              <Icon size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-white/80">{label}</span>
          </button>
        ))}
      </div>

      <AddTransactionSheet
        isOpen={incomeOpen}
        onClose={closeSheet}
        transactionType="income"
      />
      <AddTransactionSheet
        isOpen={expenseOpen}
        onClose={closeSheet}
        transactionType="expense"
      />
      <QuickTransferSheet isOpen={transferOpen} onClose={closeSheet} />
      <WalletFormSheet
        isOpen={walletOpen}
        onClose={closeSheet}
        wallet={null}
        onSuccess={(_w: Wallet) => {
          closeSheet();
          router.refresh();
        }}
      />
    </>
  );
}
