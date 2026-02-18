"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { revalidateTransactionPaths } from "@/app/actions";
import { Loader2, Receipt, Banknote, Calendar } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { getTodayLocal } from "@/lib/date-range";
import CurrencyInput from "./CurrencyInput";
import { REFRESH_NOTIFICATIONS_EVENT } from "./NotificationsBadge";
import { REFRESH_CATEGORIES_EVENT } from "@/lib/app-events";
import { formThemes, getTransactionAccent } from "@/lib/form-themes";
import { BaseSheet } from "@/components/shared/BaseSheet";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { getCategoryStyle } from "@/lib/category-icons";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
import { Button, Input } from "@/components/ui";
import type { Category, Wallet } from "@/types";

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fixed type - no toggle, form is either Income or Expense */
  transactionType: "income" | "expense";
}

export default function AddTransactionSheet({ isOpen, onClose, transactionType }: AddTransactionSheetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const isIncome = transactionType === "income";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Dynamic theme based on transaction type
  const accent = getTransactionAccent(transactionType);
  const theme = formThemes[accent];

  // Filter categories by transaction type. Treat null/empty/whitespace as 'expense'.
  const filteredCategories = useMemo(() => {
    const targetType = isIncome ? "income" : "expense";
    return categories.filter((cat) => {
      const effectiveType = (cat.type || "expense").toString().trim().toLowerCase();
      return effectiveType === targetType;
    });
  }, [categories, isIncome]);

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (user?.id) {
        fetchWallets();
        fetchCategories();
      }
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, user?.id, setIsSheetOpen]);

  // Refetch categories when user adds/updates one (e.g. from Profile > Manage Categories)
  useEffect(() => {
    const onRefresh = () => {
      if (isOpen && user?.id) fetchCategories();
    };
    window.addEventListener(REFRESH_CATEGORIES_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_CATEGORIES_EVENT, onRefresh);
  }, [isOpen, user?.id]);

  useEffect(() => {
    return () => {
      setIsSheetOpen(false);
    };
  }, [setIsSheetOpen]);

  // Clear selected category when it's not in the filtered list
  useEffect(() => {
    if (selectedCategory && filteredCategories.length > 0) {
      const exists = filteredCategories.some((c) => c.id === selectedCategory);
      if (!exists) setSelectedCategory(null);
    }
  }, [filteredCategories, selectedCategory]);

  const fetchWallets = async () => {
    if (!user?.id) {
      showToast(TOAST_MESSAGES.ERROR.USER_NOT_FOUND_LOGIN, "error");
      return;
    }

    try {
      setIsLoadingWallets(true);
      const { data, error } = await supabaseClient
        .from("wallets")
        .select("id, name, balance, type, user_id")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setWallets(data as Wallet[]);
        if (!selectedWallet) {
          setSelectedWallet(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
      showToast(TOAST_MESSAGES.ERROR.WALLETS_LOAD_FAILED, "error");
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const fetchCategories = async () => {
    if (!user?.id) {
      setCategories([]);
      return;
    }

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
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      showToast(TOAST_MESSAGES.ERROR.USER_NOT_FOUND_LOGIN, "error");
      return;
    }

    if (amount <= 0) {
      showToast(TOAST_MESSAGES.ERROR.VALIDATE_AMOUNT, "error");
      return;
    }

    if (!description?.trim()) {
      showToast(TOAST_MESSAGES.ERROR.VALIDATE_DESCRIPTION, "error");
      return;
    }

    if (!selectedCategory) {
      showToast(TOAST_MESSAGES.ERROR.VALIDATE_CATEGORY, "error");
      return;
    }

    if (!selectedWallet) {
      showToast(TOAST_MESSAGES.ERROR.VALIDATE_WALLET, "error");
      return;
    }

    try {
      setIsLoading(true);

      const selectedWalletData = wallets.find(w => w.id === selectedWallet);
      
      if (!selectedWalletData) {
        throw new Error("Wallet tidak ditemukan");
      }

      let categoryId: string | null = null;
      if (selectedCategory) {
        const foundCategory = categories.find(cat => 
          cat.name.toLowerCase() === selectedCategory.toLowerCase() || 
          cat.id === selectedCategory
        );
        if (foundCategory) {
          categoryId = foundCategory.id;
        } else {
          categoryId = selectedCategory;
        }
      }

      const transactionData: any = {
        amount,
        type: isIncome ? "income" : "expense",
        date: selectedDate,
        description: description.trim(),
        category_id: categoryId,
        user_id: user.id,
        source_wallet_id: selectedWallet,
        destination_wallet_id: null,
      };

      const { data, error } = await supabaseClient
        .from("transactions")
        .insert([transactionData])
        .select();

      if (error) {
        console.error("Supabase error:", error.code, error.message);
        throw error;
      }

      await revalidateTransactionPaths();
      router.refresh();
      showToast(TOAST_MESSAGES.SUCCESS.TRANSACTION_SAVED, "success");
      window.dispatchEvent(new CustomEvent(REFRESH_NOTIFICATIONS_EVENT));
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      
      let errorMessage = error?.message || "Gagal menyimpan transaksi. Silakan coba lagi.";
      
      if (error?.message?.toLowerCase().includes("rate limit") || 
          error?.message?.toLowerCase().includes("too many requests") ||
          error?.status === 429) {
        errorMessage = "Terlalu banyak request. Silakan tunggu beberapa saat dan coba lagi.";
      }
      
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount(0);
    setDescription("");
    setSelectedCategory(null);
    setSelectedWallet(wallets.length > 0 ? wallets[0].id : "");
    setSelectedDate(getTodayLocal());
  };

  return (
    <BaseSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isIncome ? "Tambah Pemasukan" : "Tambah Pengeluaran"}
      titleAccent={
        <div className={`w-2 h-2 rounded-full ${isIncome ? "bg-emerald-400" : "bg-rose-400"}`} />
      }
      disabled={isLoading}
    >
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
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Deskripsi
              </label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Makan siang, Gaji bulanan"
                disabled={isLoading}
                className="rounded-2xl"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Kategori
              </label>
              {isLoadingCategories ? (
                <div className="w-full px-4 py-3 text-white/60 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading categories...</span>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="w-full px-4 py-3 text-white/60 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className="text-sm">
                    {categories.length === 0
                      ? "Belum ada kategori. Silakan tambahkan kategori terlebih dahulu."
                      : `Belum ada kategori ${isIncome ? "pemasukan" : "pengeluaran"}. Tambahkan di halaman Categories.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {filteredCategories.map((category) => {
                    const catColor = category.color || "#06b6d4";
                    const bgColor = `${catColor}20`;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        disabled={isLoading}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all disabled:opacity-50 ${
                          isSelected
                            ? `${theme.selectedBorder}`
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                        style={isSelected ? { backgroundColor: bgColor } : undefined}
                        title={category.name}
                      >
                        <CategoryIconDisplay
                          icon={category.icon}
                          name={category.name}
                          size={24}
                          className={isSelected ? "" : "text-slate-400"}
                          style={{ color: isSelected ? catColor : undefined }}
                        />
                        <span className={`text-xs font-medium truncate w-full text-center ${isSelected ? "text-white" : "text-white/60"}`}>
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wallet Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Wallet
              </label>
              <div className="relative">
                {isLoadingWallets ? (
                  <div className="w-full px-4 py-3 text-white/60 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading wallets...</span>
                  </div>
                ) : (
                  <select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    disabled={isLoading || wallets.length === 0}
                    className={`w-full px-4 py-3 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer disabled:opacity-50 ${theme.inputFocus}`}
                    style={{ colorScheme: 'dark' }}
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id} className="bg-slate-900 text-white">
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

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
                  disabled={isLoading}
                  className={`w-full pl-12 pr-4 py-4 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${theme.inputFocus} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5`}
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Menyimpan...</span>
                </>
              ) : (
                isIncome ? "Simpan Pemasukan" : "Simpan Pengeluaran"
              )}
            </Button>
          </form>
    </BaseSheet>
  );
}
