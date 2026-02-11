"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import CurrencyInput from "./CurrencyInput";
import { formThemes } from "@/lib/form-themes";
import type { Budget, Category } from "@/types";

interface BudgetFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budget: (Budget & { category: Category | null }) | null;
  categories: Category[];
  existingBudgetCategoryIds: string[];
  onSuccess: () => void;
}

export default function BudgetFormSheet({
  isOpen,
  onClose,
  budget,
  categories,
  existingBudgetCategoryIds,
  onSuccess,
}: BudgetFormSheetProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [categoryId, setCategoryId] = useState(budget?.category_id || "");
  const [amount, setAmount] = useState(budget?.amount || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Violet theme for budget forms
  const theme = formThemes.violet;

  const expenseCategories = categories.filter(
    (c) => c.type === "expense" || !c.type
  );
  const availableCategories = budget
    ? expenseCategories
    : expenseCategories.filter((c) => !existingBudgetCategoryIds.includes(c.id));

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (budget) {
        setCategoryId(budget.category_id);
        setAmount(budget.amount);
      } else {
        setCategoryId("");
        setAmount(0);
      }
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, budget, setIsSheetOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      showToast("Pilih kategori terlebih dahulu.", "error");
      return;
    }

    if (amount <= 0) {
      showToast("Jumlah budget harus lebih dari 0.", "error");
      return;
    }

    if (!user?.id) {
      showToast("User tidak ditemukan.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const budgetData = {
        user_id: user.id,
        category_id: categoryId,
        amount,
      };

      if (budget) {
        const { error } = await supabaseClient
          .from("budgets")
          .update({ amount })
          .eq("id", budget.id)
          .eq("user_id", user.id);

        if (error) throw error;
        showToast("Budget berhasil diupdate!", "success");
      } else {
        const existing = await supabaseClient
          .from("budgets")
          .select("id")
          .eq("user_id", user.id)
          .eq("category_id", categoryId)
          .single();

        if (existing.data) {
          const { error } = await supabaseClient
            .from("budgets")
            .update({ amount })
            .eq("id", existing.data.id)
            .eq("user_id", user.id);

          if (error) throw error;
          showToast("Budget berhasil diupdate!", "success");
        } else {
          const { error } = await supabaseClient
            .from("budgets")
            .insert([budgetData]);

          if (error) throw error;
          showToast("Budget berhasil ditambahkan!", "success");
        }
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error saving budget:", error);
      showToast(
        (error as { message?: string })?.message || "Gagal menyimpan budget.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[60] animate-in">
        <div
          className="mx-auto max-w-2xl rounded-t-3xl rounded-b-none bg-[#181A25] border-t border-x border-white/10 shadow-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <h2 className="text-xl font-bold text-white">
                {budget ? "Edit Budget" : "Tambah Budget"}
              </h2>
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
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!budget}
              className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${theme.inputFocus}`}
              style={{ colorScheme: "dark" }}
            >
              <option value="">Pilih kategori</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#181A25]">
                  {cat.name}
                </option>
              ))}
            </select>
            {availableCategories.length === 0 && !budget && (
              <p className="mt-2 text-sm text-amber-400">
                Semua kategori sudah memiliki budget. Edit dari daftar budget.
              </p>
            )}
          </div>

          {/* Amount - CurrencyInput */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Target Budget
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              accent="violet"
            />
          </div>

          {/* Submit - violet themed */}
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
            ) : budget ? (
              "Update Budget"
            ) : (
              "Tambah Budget"
            )}
          </button>
        </form>
        </div>
      </div>
    </>
  );
}
