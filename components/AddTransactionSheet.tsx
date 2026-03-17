"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { revalidateTransactionPaths } from "@/app/actions";
import { Loader2, Calendar, WifiOff } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { getTodayLocal } from "@/lib/date-range";
import CurrencyInput from "./CurrencyInput";
import { REFRESH_CATEGORIES_EVENT } from "@/lib/app-events";
import { formThemes, getTransactionAccent } from "@/lib/form-themes";
import { BaseSheet } from "@/components/shared/BaseSheet";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
import { Button, Input, ThemeSelect } from "@/components/ui";
import { useOptimisticTransactionStore } from "@/stores/optimisticTransactionStore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useHaptic } from "@/hooks/useHaptic";
import type { Category, Wallet } from "@/types";

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fixed type - no toggle, form is either Income or Expense */
  transactionType: "income" | "expense";
  /** Pre-fill amount and description (e.g. from Calculator) */
  initialData?: { amount: number; description: string };
}

export default function AddTransactionSheet({
  isOpen,
  onClose,
  transactionType,
  initialData,
}: AddTransactionSheetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const { addOptimistic, removeOptimistic } = useOptimisticTransactionStore();
  const isOnline = useNetworkStatus();
  const { lightTap, successVibrate } = useHaptic();
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const isIncome = transactionType === "income";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
      if (initialData) {
        setAmount(initialData.amount);
        setDescription(initialData.description);
      }
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, user?.id, setIsSheetOpen, initialData]);

  // Reset form when closed so next open starts clean
  useEffect(() => {
    if (!isOpen) {
      setAmount(0);
      setDescription("");
    }
  }, [isOpen]);

  // Refetch categories when user adds/updates one (e.g. from Settings > Manage Categories)
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
    lightTap();

    if (!isOnline) {
      showToast("Koneksi terputus. Pastikan Anda online untuk menyimpan transaksi.", "error");
      return;
    }

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

    const selectedWalletData = wallets.find((w) => w.id === selectedWallet);
    if (!selectedWalletData) {
      showToast("Wallet not found", "error");
      return;
    }

    let categoryId: string | null = null;
    if (selectedCategory) {
      const foundCategory = categories.find(
        (cat) =>
          cat.name.toLowerCase() === selectedCategory.toLowerCase() ||
          cat.id === selectedCategory
      );
      categoryId = foundCategory ? foundCategory.id : selectedCategory;
    }

    const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const walletDelta = isIncome ? amount : -amount;

    addOptimistic(
      {
        id: tempId,
        amount,
        type: isIncome ? "income" : "expense",
        date: selectedDate,
        description: description.trim(),
        category_id: categoryId,
        source_wallet_id: selectedWallet,
        destination_wallet_id: null,
      },
      { [selectedWallet]: walletDelta }
    );

    onClose();
    resetForm();
    showToast(TOAST_MESSAGES.SUCCESS.SAVING_TRANSACTION, "success");

    const transactionData = {
      amount,
      type: isIncome ? "income" : "expense",
      date: selectedDate,
      description: description.trim(),
      category_id: categoryId,
      user_id: user.id,
      source_wallet_id: selectedWallet,
      destination_wallet_id: null,
    };

    (async () => {
      try {
        const { error } = await supabaseClient
          .from("transactions")
          .insert([transactionData])
          .select();

        if (error) throw error;

        removeOptimistic(tempId);
        await revalidateTransactionPaths();
        router.refresh();
        successVibrate();
        showToast(TOAST_MESSAGES.SUCCESS.TRANSACTION_SAVED, "success");
      } catch (error: any) {
        removeOptimistic(tempId);
        console.error("Error saving transaction:", error);
        const msg =
          error?.message?.toLowerCase().includes("rate limit") ||
          error?.message?.toLowerCase().includes("too many requests") ||
          error?.status === 429
            ? "Too many requests. Please wait a moment."
            : error?.message || "Gagal menyimpan transaksi. Coba lagi.";
        showToast(msg, "error");
      }
    })();
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
      title={isIncome ? "Add Income" : "Add Expense"}
      titleAccent={
        <div className={`w-2 h-2 rounded-full ${isIncome ? "bg-emerald-400" : "bg-rose-400"}`} />
      }
                  disabled={false}
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Amount
              </label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                accent={accent}
                disabled={false}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Description
              </label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lunch, Monthly salary"
                disabled={false}
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Category
              </label>
              {isLoadingCategories ? (
                <div className="w-full px-4 py-3 text-muted-foreground bg-muted/50 border border-border rounded-2xl flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading categories...</span>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="w-full px-4 py-3 text-muted-foreground bg-muted/50 border border-border rounded-2xl text-center">
                  <p className="text-sm">
                    {categories.length === 0
                      ? "No categories yet. Please add categories first."
                      : `No ${isIncome ? "income" : "expense"} categories yet. Add them in Settings > Manage Categories.`}
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
                        disabled={false}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all disabled:opacity-50 ${
                          isSelected
                            ? `${theme.selectedBorder}`
                            : "bg-muted/50 border-border hover:border-primary/50"
                        }`}
                        style={isSelected ? { backgroundColor: bgColor } : undefined}
                        title={category.name}
                      >
                        <CategoryIconDisplay
                          icon={category.icon}
                          name={category.name}
                          size={24}
                          className={isSelected ? "" : "text-muted-foreground"}
                          style={{ color: isSelected ? catColor : undefined }}
                        />
                        <span className={`text-xs font-medium truncate w-full text-center ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Wallet
              </label>
              <div className="relative">
                {isLoadingWallets ? (
                  <div className="w-full px-4 py-3 text-muted-foreground bg-muted/50 border border-border rounded-2xl flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading wallets...</span>
                  </div>
                ) : (
                  <ThemeSelect
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    options={wallets.map((w) => ({ value: w.id, label: w.name }))}
                    disabled={wallets.length === 0}
                    className={`disabled:opacity-50 ${theme.inputFocus}`}
                  />
                )}
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Date
              </label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" size={20} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={false}
                  className={`w-full rounded-none border-0 border-b-2 border-input bg-transparent pl-12 pr-4 py-2 text-foreground focus:outline-none focus:ring-0 disabled:opacity-50 transition-colors ${theme.inputFocus} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5`}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground/70">
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
              disabled={isLoadingWallets || isLoadingCategories}
              size="lg"
              className="w-full"
            >
              {!isOnline ? (
                <>
                  <WifiOff size={18} className="shrink-0" />
                  Offline - Klik untuk info
                </>
              ) : (
                isIncome ? "Save Income" : "Save Expense"
              )}
            </Button>
          </form>
    </BaseSheet>
  );
}
