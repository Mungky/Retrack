"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import CategoryFormSheet from "./CategoryFormSheet";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { getCategoryIcon } from "@/lib/category-icons";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Category } from "@/types";

interface CategoryManagementProps {
  initialCategories: Category[];
}

export default function CategoryManagement({
  initialCategories,
}: CategoryManagementProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const filteredCategories = categories.filter((cat) => {
    const effectiveType = (cat.type || "expense").toLowerCase();
    if (filter === "all") return true;
    return effectiveType === filter;
  });

  const handleDelete = async (categoryId: string) => {
    if (!user?.id) return;

    try {
      const { data: budgets, error: budgetError } = await supabaseClient
        .from("budgets")
        .select("id")
        .eq("category_id", categoryId)
        .eq("user_id", user.id)
        .limit(1);

      if (budgetError) throw budgetError;

      if (budgets && budgets.length > 0) {
        showToast(TOAST_MESSAGES.ERROR.CATEGORY_IN_BUDGET, "error");
        setIsDeleteOpen(false);
        return;
      }

      const { data: transactions, error: checkError } = await supabaseClient
        .from("transactions")
        .select("id")
        .eq("category_id", categoryId)
        .eq("user_id", user.id)
        .limit(1);

      if (checkError) throw checkError;

      if (transactions && transactions.length > 0) {
        showToast(TOAST_MESSAGES.ERROR.CATEGORY_HAS_TRANSACTIONS, "error");
        setIsDeleteOpen(false);
        return;
      }

      const { error } = await supabaseClient
        .from("categories")
        .delete()
        .eq("id", categoryId)
        .eq("user_id", user.id);

      if (error) throw error;

      setCategories(categories.filter((c) => c.id !== categoryId));
      showToast(TOAST_MESSAGES.SUCCESS.CATEGORY_DELETED, "success");
      setIsDeleteOpen(false);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      showToast(error?.message || TOAST_MESSAGES.ERROR.CATEGORY_DELETE_FAILED, "error");
    }
  };

  const renderCategoryCard = (category: Category) => {
    const Icon = getCategoryIcon(category.icon, category.name);
    const effectiveType = (category.type || "expense").toLowerCase();
    return (
      <div
        key={category.id}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 border border-slate-800 p-5 hover:border-slate-700 transition-all"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="p-4 rounded-xl"
            style={{
              backgroundColor: category.color
                ? `${category.color}20`
                : "rgba(6, 182, 212, 0.2)",
            }}
          >
            <Icon
              size={32}
              className="flex-shrink-0"
              style={{
                color: category.color || "#06b6d4",
              }}
            />
          </div>
          <h3 className="text-white font-semibold text-center">
            {category.name}
          </h3>
          <div className="flex items-center gap-2">
            <p
              className={`text-xs font-semibold ${
                effectiveType === "income"
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {effectiveType === "income" ? "Income" : "Expense"}
            </p>
          </div>
        </div>

        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setSelectedCategory(category);
                setIsFormOpen(true);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Pencil className="text-cyan-400" size={16} />
            </button>
            <button
              onClick={() => {
                setSelectedCategory(category);
                setIsDeleteOpen(true);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Trash2 className="text-red-400" size={16} />
            </button>
          </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "income", "expense"] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filter === filterType
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-slate-900/50 text-slate-400 border border-slate-800"
            }`}
          >
            {filterType === "all"
              ? "All"
              : filterType === "income"
              ? "Income"
              : "Expense"}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={() => {
          setSelectedCategory(null);
          setIsFormOpen(true);
        }}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        <span>Add Category</span>
      </button>

      {/* Categories List */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-12 text-center">
          <p className="text-slate-400">No categories yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* When filter is "all", group by type with section headers */}
          {filter === "all" ? (
            <>
              {/* Expense Section */}
              {filteredCategories.filter((c) => (c.type || "expense") === "expense").length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Expense
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {filteredCategories
                      .filter((c) => (c.type || "expense") === "expense")
                      .map((category) => renderCategoryCard(category))}
                  </div>
                </div>
              )}
              {/* Income Section */}
              {filteredCategories.filter((c) => (c.type || "expense") === "income").length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Income
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {filteredCategories
                      .filter((c) => (c.type || "expense") === "income")
                      .map((category) => renderCategoryCard(category))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredCategories.map((category) => renderCategoryCard(category))}
            </div>
          )}
        </div>
      )}

      <CategoryFormSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={(newCategory) => {
          if (selectedCategory) {
            setCategories(
              categories.map((c) =>
                c.id === selectedCategory.id ? newCategory : c
              )
            );
          } else {
            setCategories([...categories, newCategory]);
          }
          setIsFormOpen(false);
          setSelectedCategory(null);
        }}
      />

      {selectedCategory && (
        <DeleteConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedCategory(null);
          }}
          transactionId={selectedCategory.id}
          onConfirm={() => handleDelete(selectedCategory.id)}
        />
      )}
    </div>
  );
}
