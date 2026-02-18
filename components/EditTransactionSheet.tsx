"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { revalidateTransactionPaths } from "@/app/actions";
import { X, Loader2, Calendar } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { REFRESH_CATEGORIES_EVENT } from "@/lib/app-events";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
import CurrencyInput from "./CurrencyInput";
import { formThemes, getTransactionAccent } from "@/lib/form-themes";
import { Z_INDEX } from "@/lib/z-index";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
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
  const [amount, setAmount] = useState(transaction.amount);
  const [description, setDescription] = useState(transaction.description || "");
  const [isIncome, setIsIncome] = useState(transaction.type === "income");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    transaction.category_id
  );
  const [selectedWallet, setSelectedWallet] = useState<string>(
    transaction.source_wallet_id || ""
  );
  const [selectedDate, setSelectedDate] = useState(transaction.date);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Dynamic theme based on current type toggle
  const accent = getTransactionAccent(isIncome ? "income" : "expense");
  const theme = formThemes[accent];

  useEffect(() => {
    if (isOpen && user?.id) {
      setIsSheetOpen(true);
      setAmount(transaction.amount);
      setDescription(transaction.description || "");
      setIsIncome(transaction.type === "income");
      setSelectedCategory(transaction.category_id);
      setSelectedWallet(transaction.source_wallet_id || "");
      setSelectedDate(transaction.date);
      fetchWallets();
      fetchCategories();
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, user?.id, setIsSheetOpen, transaction.id]);

  // Refetch categories when user adds/updates one elsewhere
  useEffect(() => {
    const onRefresh = () => {
      if (isOpen && user?.id) fetchCategories();
    };
    window.addEventListener(REFRESH_CATEGORIES_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_CATEGORIES_EVENT, onRefresh);
  }, [isOpen, user?.id]);

  // Filter categories by transaction type. Treat null/empty/whitespace as 'expense'.
  const filteredCategories = useMemo(() => {
    const targetType = isIncome ? "income" : "expense";
    return categories.filter((cat) => {
      const effectiveType = (cat.type || "expense").toString().trim().toLowerCase();
      return effectiveType === targetType;
    });
  }, [categories, isIncome]);

  // Clear selected category when it's not in the filtered list
  useEffect(() => {
    if (selectedCategory && filteredCategories.length > 0) {
      const exists = filteredCategories.some((c) => c.id === selectedCategory);
      if (!exists) setSelectedCategory(null);
    }
  }, [filteredCategories, selectedCategory]);

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
        .select("id, name, icon, type, color")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      const list = ((data as Category[]) || []).sort((a, b) => a.name.localeCompare(b.name));
      setCategories(list);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description?.trim() || !selectedWallet || !selectedCategory) {
      showToast(TOAST_MESSAGES.ERROR.VALIDATE_ALL_FIELDS, "error");
      return;
    }

    if (amount <= 0) {
      showToast(TOAST_MESSAGES.ERROR.VALIDATE_AMOUNT_ALT, "error");
      return;
    }

    if (!user?.id) {
      showToast(TOAST_MESSAGES.ERROR.USER_NOT_FOUND, "error");
      return;
    }

    setIsLoading(true);

    try {
      const transactionData: any = {
        amount,
        type: isIncome ? "income" : "expense",
        date: selectedDate,
        description: description.trim(),
        category_id: selectedCategory,
        user_id: user.id,
        source_wallet_id: selectedWallet,
        destination_wallet_id: null,
      };

      const { error } = await supabaseClient
        .from("transactions")
        .update(transactionData)
        .eq("id", transaction.id);

      if (error) throw error;

      await revalidateTransactionPaths();
      showToast(TOAST_MESSAGES.SUCCESS.TRANSACTION_UPDATED, "success");
      onClose();
      setTimeout(() => router.refresh(), 500);
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      showToast(error?.message || TOAST_MESSAGES.ERROR.TRANSACTION_UPDATE_FAILED, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-300"
        style={{ zIndex: Z_INDEX.backdrop }}
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 animate-in" style={{ zIndex: Z_INDEX.sheet }}>
        <div
          className="mx-auto max-w-2xl rounded-t-3xl rounded-b-none sheet-bg-dark border-t border-x shadow-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'} transition-colors`} />
              <h2 className="text-xl font-bold text-white">Edit Transaksi</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="text-white/60" size={20} />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6 overflow-y-auto"
            style={{
              maxHeight: "calc(90vh - 140px)",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
          {/* Amount - CurrencyInput */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Nominal
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              accent={accent}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Deskripsi
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Makan siang, Gaji bulanan"
              className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all ${theme.inputFocus}`}
            />
          </div>

          {/* Type Toggle - themed */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setIsIncome(false);
                setSelectedCategory(null);
              }}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                !isIncome
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-white/5 text-slate-400 border border-white/10"
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setIsIncome(true);
                setSelectedCategory(null);
              }}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                isIncome
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-slate-400 border border-white/10"
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Category */}
          {!isLoadingCategories && filteredCategories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Kategori
              </label>
              <div className="grid grid-cols-4 gap-3">
                {filteredCategories.map((category) => {
                  const catColor = category.color || "#06b6d4";
                  const bgColor = `${catColor}20`;
                  const isSelected = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? `${theme.selectedBorder}`
                          : "bg-white/5 border-white/10"
                      }`}
                      style={isSelected ? { backgroundColor: bgColor } : undefined}
                    >
                      <CategoryIconDisplay
                        icon={category.icon}
                        name={category.name}
                        size={24}
                        className={`mx-auto mb-2 flex-shrink-0 ${
                          isSelected ? "" : "text-slate-400"
                        }`}
                        style={{ color: isSelected ? catColor : undefined }}
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
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Wallet
              </label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 transition-all ${theme.inputFocus}`}
                style={{ colorScheme: 'dark' }}
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

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Tanggal
            </label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 transition-all ${theme.inputFocus} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5`}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              {new Date(selectedDate).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Submit - themed */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl ${theme.submitGradient} text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            style={{ boxShadow: theme.submitShadow }}
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
    </>
  );
}
