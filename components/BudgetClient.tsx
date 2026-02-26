"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
import { revalidateTransactionPaths } from "@/app/actions";
import BudgetFormSheet from "./BudgetFormSheet";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/contexts/ToastContext";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { supabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { usePremiumModal } from "@/stores/premiumModalStore";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import type { Budget, Category, Transaction } from "@/types";

type BudgetWithCategory = Budget & { category: (Category & { type?: string }) | null };

interface BudgetClientProps {
  initialBudgets: BudgetWithCategory[];
  categories: Category[];
  expensesThisMonth: Transaction[];
  incomeThisMonth: Transaction[];
}

/** Bar color - sesuaikan dengan tema (primary) */
function getExpenseBarColor(_remainingPercent: number) {
  return "bg-primary";
}

/** Bar color - sesuaikan dengan tema (primary) */
function getIncomeBarColor(_progressPercent: number) {
  return "bg-primary";
}

export default function BudgetClient({
  initialBudgets,
  categories,
  expensesThisMonth,
  incomeThisMonth,
}: BudgetClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const { open: openPremium } = usePremiumModal();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>(initialBudgets);

  const canAddBudget = isPro || budgets.length < 1;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetWithCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  const computed = useMemo(() => {
    const spentByCategory: Record<string, number> = {};
    for (const t of expensesThisMonth) {
      const cid = t.category_id || "uncategorized";
      spentByCategory[cid] = (spentByCategory[cid] || 0) + Number(t.amount || 0);
    }
    const savedByCategory: Record<string, number> = {};
    for (const t of incomeThisMonth) {
      const cid = t.category_id || "uncategorized";
      savedByCategory[cid] = (savedByCategory[cid] || 0) + Number(t.amount || 0);
    }

    return budgets.map((b) => {
      const categoryType = (b.category?.type || "expense").toLowerCase();
      const target = b.amount;

      if (categoryType === "income") {
        const saved = savedByCategory[b.category_id] || 0;
        const progressPercent = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
        return {
          ...b,
          categoryType: "income" as const,
          spent: saved,
          target,
          progressPercent,
          remaining: Math.max(0, target - saved),
        };
      }

      const spent = spentByCategory[b.category_id] || 0;
      const remaining = Math.max(0, target - spent);
      const remainingPercent = target > 0 ? (remaining / target) * 100 : 100;
      const spentPercent = target > 0 ? Math.min((spent / target) * 100, 150) : 0;
      return {
        ...b,
        categoryType: "expense" as const,
        spent,
        target,
        remaining,
        remainingPercent,
        spentPercent,
      };
    });
  }, [budgets, expensesThisMonth, incomeThisMonth]);

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      const { error } = await supabaseClient
        .from("budgets")
        .delete()
        .eq("id", budgetId)
        .eq("user_id", user.id);

      if (error) throw error;
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
      setDeletingBudget(null);
      showToast(TOAST_MESSAGES.SUCCESS.BUDGET_DELETED, "success");
      revalidateTransactionPaths();
      router.refresh();
    } catch (error) {
      console.error("Error deleting budget:", error);
      showToast(TOAST_MESSAGES.ERROR.BUDGET_DELETE_FAILED, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const existingBudgetCategoryIds = useMemo(
    () => budgets.map((b) => b.category_id),
    [budgets]
  );

  const refresh = () => {
    revalidateTransactionPaths();
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">
            Budget
          </h1>
          <p className="text-white/60 text-sm">
            Manage monthly spending targets per category
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!canAddBudget) {
                openPremium();
                return;
              }
              setEditingBudget(null);
              setIsFormOpen(true);
            }}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary/20 border border-primary/40 text-primary font-semibold hover:bg-primary/30 transition-all ${!canAddBudget ? "opacity-85" : ""}`}
          >
            {!canAddBudget ? <Lock size={20} className="text-amber-500" /> : <Plus size={20} />}
            Create Budget
          </button>
        </div>
      </div>

      {/* Budget Cards */}
      {computed.length === 0 ? (
        <div className="fintech-card p-12 text-center">
          <p className="text-white/50 mb-4">No budgets yet. Start by adding a budget.</p>
          <button
            onClick={() => {
              if (!canAddBudget) {
                openPremium();
                return;
              }
              setEditingBudget(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors"
          >
            <Plus size={18} />
            Add First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {computed.map((item) => {
            const cat = item.category;
            const catColor = cat?.color || "#06b6d4";
            const isExpense = item.categoryType === "expense";

            const barColor = isExpense
              ? getExpenseBarColor(item.remainingPercent ?? 0)
              : getIncomeBarColor(item.progressPercent ?? 0);

            const barWidth = isExpense ? (item.remainingPercent ?? 100) : (item.progressPercent ?? 0);

            const statusLabel = isExpense
              ? `${formatCurrency(item.remaining ?? 0)} remaining`
              : `${formatCurrency(item.spent ?? 0)} / ${formatCurrency(item.target)} saved`;

            return (
              <div
                key={item.id}
                className="fintech-card p-5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: cat ? `${catColor}20` : "rgba(148, 163, 184, 0.15)" }}
                    >
                      {cat ? (
                        <CategoryIconDisplay
                          icon={cat.icon}
                          name={cat.name}
                          size={24}
                          style={{ color: catColor }}
                        />
                      ) : (
                        <CategoryIconDisplay icon={null} name="" size={24} style={{ color: "#94a3b8" }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold truncate">
                        {item.category?.name || "Uncategorized"}
                      </h3>
                      <p className="text-sm text-white/60 mt-0.5">
                        {isExpense
                          ? `${formatCurrency(item.spent)} / ${formatCurrency(item.target)} spent`
                          : statusLabel}
                      </p>
                      <div
                        className="mt-3 h-3 rounded-full bg-muted overflow-hidden flex"
                        role="progressbar"
                        aria-valuenow={barWidth}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        {isExpense ? (
                          /* Spend: bar dari kiri (100% remaining = penuh, 0% = kosong), konsumsi dari kanan ke kiri */
                          <div
                            className={`h-full transition-all duration-500 ease-out ${barColor} rounded-l-full shrink-0 ${barWidth >= 100 ? "rounded-full" : ""}`}
                            style={{
                              width: `${barWidth}%`,
                              minWidth: barWidth > 0 ? 4 : 0,
                            }}
                          />
                        ) : (
                          /* Income: bar dari kiri ke kanan (0%→100%) */
                          <div
                            className={`h-full transition-all duration-500 ease-out ${barColor} rounded-full shrink-0`}
                            style={{
                              width: `${barWidth}%`,
                              minWidth: barWidth > 0 ? 4 : 0,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingBudget(item);
                        setIsFormOpen(true);
                      }}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                      aria-label="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingBudget(item)}
                      className="p-2 rounded-xl hover:bg-rose-500/20 transition-colors text-white/50 hover:text-rose-400"
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {isExpense && item.spent > item.target && (
                  <p className="mt-2 text-sm text-rose-400 font-medium">
                    Over budget: +{formatCurrency(item.spent - item.target)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BudgetFormSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBudget(null);
        }}
        budget={editingBudget}
        categories={categories}
        existingBudgetCategoryIds={editingBudget ? [] : existingBudgetCategoryIds}
        onSuccess={() => {
          refresh();
        }}
      />

      {deletingBudget && (
        <ConfirmDialog
          isOpen={!!deletingBudget}
          onClose={() => setDeletingBudget(null)}
          title="Delete Budget"
          description="Are you sure you want to delete this budget? This action cannot be undone."
          onConfirm={() => handleDeleteBudget(deletingBudget.id)}
          isLoading={isDeleting}
          variant="danger"
          confirmLabel="Delete"
        />
      )}
    </div>
  );
}
