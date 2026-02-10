"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Coffee,
  Plane,
  Banknote,
  Pencil,
} from "lucide-react";
import { revalidateTransactionPaths } from "@/app/actions";
import BudgetFormSheet from "./BudgetFormSheet";
import type { Budget, Category, Transaction } from "@/types";

type BudgetWithCategory = Budget & { category: Category | null };

interface BudgetClientProps {
  initialBudgets: BudgetWithCategory[];
  categories: Category[];
  expensesThisMonth: Transaction[];
}

function getCategoryStyle(categoryName: string | null | undefined) {
  if (!categoryName) {
    return { icon: Banknote, iconColor: "text-slate-400", bgColor: "bg-slate-500/15" };
  }
  const n = categoryName.toLowerCase().trim();
  const map: Record<string, { icon: typeof Banknote; iconColor: string; bgColor: string }> = {
    food: { icon: Utensils, iconColor: "text-orange-500", bgColor: "bg-orange-500/15" },
    shopping: { icon: ShoppingBag, iconColor: "text-pink-500", bgColor: "bg-pink-500/15" },
    transport: { icon: Car, iconColor: "text-blue-500", bgColor: "bg-blue-500/15" },
    bills: { icon: Zap, iconColor: "text-yellow-500", bgColor: "bg-yellow-500/15" },
    health: { icon: HeartPulse, iconColor: "text-red-500", bgColor: "bg-red-500/15" },
    entertainment: { icon: Gamepad2, iconColor: "text-purple-500", bgColor: "bg-purple-500/15" },
    education: { icon: GraduationCap, iconColor: "text-indigo-500", bgColor: "bg-indigo-500/15" },
    work: { icon: Briefcase, iconColor: "text-cyan-500", bgColor: "bg-cyan-500/15" },
    coffee: { icon: Coffee, iconColor: "text-amber-600", bgColor: "bg-amber-500/15" },
    travel: { icon: Plane, iconColor: "text-sky-500", bgColor: "bg-sky-500/15" },
  };
  for (const [key, val] of Object.entries(map)) {
    if (n.includes(key) || (key === "bills" && n.includes("tagihan"))) return val;
  }
  return { icon: Banknote, iconColor: "text-slate-400", bgColor: "bg-slate-500/15" };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
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
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-500/30 to-purple-600/30 border border-violet-500/30 text-violet-300 font-semibold hover:from-violet-500/40 hover:to-purple-600/40 transition-all"
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
            className="px-5 py-2.5 rounded-xl bg-violet-500/20 text-violet-300 font-medium hover:bg-violet-500/30 transition-colors"
          >
            Tambah Budget Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {computed.map((item) => {
            const style = getCategoryStyle(item.category?.name);
            const Icon = style.icon;
            const barColor = getProgressColor(item.percentage);

            return (
              <div
                key={item.id}
                className="fintech-card p-5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl ${style.bgColor} flex items-center justify-center`}
                    >
                      <Icon className={style.iconColor} size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold truncate">
                        {item.category?.name || "Uncategorized"}
                      </h3>
                      <p className="text-sm text-white/60 mt-0.5">
                        {formatCurrency(item.spent)} / {formatCurrency(item.target)}
                      </p>
                      <div className="mt-3 h-3 rounded-full bg-slate-800 overflow-hidden">
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
