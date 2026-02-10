"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { getCategoryIcon, getCategoryStyle } from "./AddTransactionSheet";
import type { Category, Transaction, Wallet } from "@/types";

interface EditTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export default function EditTransactionSheet({
  isOpen,
  onClose,
  transaction,
}: EditTransactionSheetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [isIncome, setIsIncome] = useState(transaction.type === "income");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    transaction.category_id
  );
  const [selectedWallet, setSelectedWallet] = useState<string>(
    transaction.type === "income"
      ? transaction.destination_wallet_id || ""
      : transaction.source_wallet_id || ""
  );
  const [selectedDate, setSelectedDate] = useState(transaction.date);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      setIsSheetOpen(true);
      fetchWallets();
      fetchCategories();
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, user?.id, setIsSheetOpen]);

  const fetchWallets = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingWallets(true);
      const { data, error } = await supabaseClient
        .from("wallets")
        .select("id, name, balance, type")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setWallets(data as Wallet[]);
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const fetchCategories = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingCategories(true);
      const { data, error } = await supabaseClient
        .from("categories")
        .select("id, name, icon")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setCategories(data as Category[]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !selectedWallet || (!selectedCategory && transaction.type !== "transfer")) {
      showToast("Mohon lengkapi semua field.", "error");
      return;
    }

    if (!user?.id) {
      showToast("User tidak ditemukan.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const amountNum = parseInt(amount.replace(/\D/g, ""));
      if (isNaN(amountNum) || amountNum <= 0) {
        showToast("Nominal tidak valid.", "error");
        return;
      }

      const transactionData: any = {
        amount: amountNum,
        type: isIncome ? "income" : "expense",
        date: selectedDate,
        category_id: selectedCategory,
        user_id: user.id,
      };

      if (isIncome) {
        transactionData.destination_wallet_id = selectedWallet;
        transactionData.source_wallet_id = null;
      } else {
        transactionData.source_wallet_id = selectedWallet;
        transactionData.destination_wallet_id = null;
      }

      const { error } = await supabaseClient
        .from("transactions")
        .update(transactionData)
        .eq("id", transaction.id);

      if (error) throw error;

      showToast("Transaksi berhasil diupdate!", "success");
      onClose();
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      showToast(error?.message || "Gagal mengupdate transaksi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-h-[90vh] bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Transaksi</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="text-slate-400" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nominal
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="Rp 0"
              className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white text-2xl font-bold placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Type Toggle */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsIncome(false)}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                !isIncome
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-slate-900/50 text-slate-400 border border-slate-800"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setIsIncome(true)}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                isIncome
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-900/50 text-slate-400 border border-slate-800"
              }`}
            >
              Income
            </button>
          </div>

          {/* Category */}
          {!isLoadingCategories && categories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Kategori
              </label>
              <div className="grid grid-cols-4 gap-3">
                {categories.map((category) => {
                  const categoryStyle = getCategoryStyle(category.name);
                  const Icon = categoryStyle.icon;
                  const isSelected = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? `${categoryStyle.bgColor} border-cyan-500/50`
                          : "bg-slate-900/50 border-slate-800"
                      }`}
                    >
                      <Icon
                        className={`mx-auto mb-2 flex-shrink-0 ${
                          isSelected ? categoryStyle.iconColor : "text-slate-400"
                        }`}
                        size={24}
                      />
                      <p
                        className={`text-xs font-semibold truncate w-full text-center ${
                          isSelected ? "text-white" : "text-slate-400"
                        }`}
                        title={category.name}
                      >
                        {category.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wallet */}
          {!isLoadingWallets && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Wallet
              </label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                <option value="">Pilih wallet</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Tanggal
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Memproses...</span>
              </>
            ) : (
              "Update Transaksi"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
