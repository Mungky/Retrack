"use client";

import { Plus, ReceiptText, Wallet as WalletIcon, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddTransactionSheet from "./AddTransactionSheet";
import WalletFormSheet from "./WalletFormSheet";
import { useSheet } from "@/contexts/SheetContext";
import { useHaptic } from "@/hooks/useHaptic";
import type { Wallet } from "@/types";

export default function FloatingActionButton() {
  const router = useRouter();
  const { setIsSheetOpen } = useSheet();
  const { lightTap, mediumClick } = useHaptic();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleOpenIncome = () => {
    lightTap();
    setIsMenuOpen(false);
    setIncomeOpen(true);
    setIsSheetOpen(true);
  };

  const handleOpenExpense = () => {
    lightTap();
    setIsMenuOpen(false);
    setExpenseOpen(true);
    setIsSheetOpen(true);
  };

  const handleCloseIncome = () => {
    setIncomeOpen(false);
    setIsSheetOpen(false);
  };

  const handleCloseExpense = () => {
    setExpenseOpen(false);
    setIsSheetOpen(false);
  };

  const handleOpenWallet = () => {
    lightTap();
    setIsMenuOpen(false);
    setIsWalletOpen(true);
    setIsSheetOpen(true);
  };

  const handleCloseWallet = () => {
    setIsWalletOpen(false);
    setIsSheetOpen(false);
  };

  return (
    <>
      {/* Blurred Modal Menu - appears when FAB is clicked */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[55] animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[56] w-[calc(100%-2rem)] max-w-sm animate-in">
            <div className="glass-card p-3 flex flex-col gap-1">
              <button
                onClick={handleOpenIncome}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <ReceiptText size={18} className="text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-white">Tambah Pemasukan</span>
              </button>

              <button
                onClick={handleOpenExpense}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="p-2 rounded-xl bg-rose-500/20">
                  <ReceiptText size={18} className="text-rose-400" />
                </div>
                <span className="text-sm font-medium text-white">Tambah Pengeluaran</span>
              </button>

              <button
                onClick={handleOpenWallet}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <WalletIcon size={18} className="text-amber-400" />
                </div>
                <span className="text-sm font-medium text-white">Add Wallet</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Glass FAB with glow */}
      <div className="fixed bottom-28 right-4 z-40">
        <button
          onClick={() => {
            mediumClick();
            setIsMenuOpen((prev) => !prev);
          }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full glass-card border-white/20 text-white hover:scale-105 transition-transform duration-200"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.1), 0 0 40px rgba(6, 182, 212, 0.35), 0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          }}
          aria-label={isMenuOpen ? "Close menu" : "Open quick actions"}
        >
          <span className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl" />
          {isMenuOpen ? (
            <X size={24} className="relative z-10" />
          ) : (
            <Plus size={26} className="relative z-10" />
          )}
        </button>
      </div>

      <AddTransactionSheet isOpen={incomeOpen} onClose={handleCloseIncome} transactionType="income" />
      <AddTransactionSheet isOpen={expenseOpen} onClose={handleCloseExpense} transactionType="expense" />

      <WalletFormSheet
        isOpen={isWalletOpen}
        onClose={handleCloseWallet}
        wallet={null}
        onSuccess={(_wallet: Wallet) => {
          handleCloseWallet();
          router.refresh();
        }}
      />
    </>
  );
}
