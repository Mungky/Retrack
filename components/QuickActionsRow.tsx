"use client";

import { Plus, Minus, ArrowRightLeft, Calculator } from "lucide-react";
import AddTransactionSheet from "./AddTransactionSheet";
import CalculatorDialog from "./CalculatorDialog";
import QuickTransferSheet from "./QuickTransferSheet";
import { useSheet } from "@/contexts/SheetContext";
import { useHaptic } from "@/hooks/useHaptic";
import { useState } from "react";

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
    label: "Tally",
    icon: Calculator,
    color: "bg-cyan-500/20 text-cyan-400",
    handler: "tally",
  },
];

export default function QuickActionsRow() {
  const { setIsSheetOpen } = useSheet();
  const { lightTap } = useHaptic();
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [tallyOpen, setTallyOpen] = useState(false);
  const [expenseInitialData, setExpenseInitialData] = useState<
    { amount: number; description: string } | undefined
  >();
  const [incomeInitialData, setIncomeInitialData] = useState<
    { amount: number; description: string } | undefined
  >();

  const handleClick = (handler: string) => {
    lightTap();
    setIsSheetOpen(true);
    if (handler === "income") setIncomeOpen(true);
    else if (handler === "expense") setExpenseOpen(true);
    else if (handler === "transfer") setTransferOpen(true);
    else if (handler === "tally") setTallyOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setIncomeOpen(false);
    setExpenseOpen(false);
    setTransferOpen(false);
    setTallyOpen(false);
    setExpenseInitialData(undefined);
    setIncomeInitialData(undefined);
  };

  const handleTallySave = (total: number, description: string, type: "income" | "expense") => {
    setTallyOpen(false);
    setIsSheetOpen(false);
    const data = { amount: total, description };
    if (type === "expense") {
      setExpenseInitialData(data);
      setExpenseOpen(true);
    } else {
      setIncomeInitialData(data);
      setIncomeOpen(true);
    }
    setIsSheetOpen(true);
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
        initialData={incomeInitialData}
      />
      <AddTransactionSheet
        isOpen={expenseOpen}
        onClose={closeSheet}
        transactionType="expense"
        initialData={expenseInitialData}
      />
      <QuickTransferSheet isOpen={transferOpen} onClose={closeSheet} />
      <CalculatorDialog
        isOpen={tallyOpen}
        onClose={closeSheet}
        onSave={handleTallySave}
      />
    </>
  );
}
