"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
import { revalidateTransactionPaths } from "@/app/actions";
import BudgetFormSheet from "./BudgetFormSheet";
import { useHaptic } from "@/hooks/useHaptic";
import { formatCurrency } from "@/lib/currency";
import type { Budget, Category, Transaction } from "@/types";

type BudgetWithCategory = Budget & { category: Category | null };

interface BudgetClientProps {
  initialBudgets: BudgetWithCategory[];
  categories: Category[];
  expensesThisMonth: Transaction[];
}

function getProgressColor(percentage: number) {
  if (percentage < 75) return "bg-emerald-500";
  if (percentage <= 100) return "bg-amber-500";
  return "bg-rose-500";
}

export default function BudgetClient({
  initialBudgets,
  categories,
  expensesThisMonth,
}: BudgetClientProps) {
  const router = useRouter();
  const { lightTap } = useHaptic();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>(initialBudgets);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);

  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  const computed = useMemo(() => {
    const spentByCategory: Record<string, number> = {};
    for (const t of expensesThisMonth) {
      const cid = t.category_id || "uncategorized";
      spentByCategory[cid] = (spentByCategory[cid] || 0) + Number(t.amount || 0);
    }

    return budgets.map((b) => {
      const spent = spentByCategory[b.category_id] || 0;
      const target = b.amount;
      const percentage = target > 0 ? Math.min((spent / target) * 100, 150) : 0;
      const remaining = Math.max(0, target - spent);
      return {
        ...b,
        spent,
        target,
        percentage,
        remaining,
      };
    });
  }, [budgets, expensesThisMonth]);

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
            Kelola target pengeluaran per kategori bulan ini
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingBudget(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary/20 border border-primary/40 text-primary font-semibold hover:bg-primary/30 transition-all"
          >
            <Plus size={20} />
            Create Budget
          </button>
        </div>
      </div>

      {/* Budget Cards */}
      {computed.length === 0 ? (
        <div className="fintech-card p-12 text-center">
          <p className="text-white/50 mb-4">Belum ada budget. Mulai dengan menambahkan budget.</p>
          <button
            onClick={() => {
              setEditingBudget(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors"
          >
            Tambah Budget Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {computed.map((item) => {
            const cat = item.category;
            const catColor = cat?.color || "#06b6d4";
            const barColor = getProgressColor(item.percentage);

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
                        {formatCurrency(item.spent)} / {formatCurrency(item.target)}
                      </p>
                      <div
                        className="mt-3 h-3 rounded-full bg-slate-800 overflow-hidden cursor-pointer touch-manipulation"
                        onClick={lightTap}
                        onTouchStart={lightTap}
                        role="progressbar"
                        aria-valuenow={item.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
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
                </div>
                {item.percentage > 100 && (
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
          router.refresh();
        }}
      />
    </div>
  );
}
