"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import CategoryFormSheet from "./CategoryFormSheet";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { getCategoryIcon } from "./AddTransactionSheet";
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const filteredCategories = categories.filter((cat) => {
    if (filter === "all") return true;
    return cat.type === filter;
  });

  const handleDelete = async (categoryId: string) => {
    if (!user?.id) return;

    try {
      // Check if category has transactions
      const { data: transactions, error: checkError } = await supabaseClient
        .from("transactions")
        .select("id")
        .eq("category_id", categoryId)
        .eq("user_id", user.id)
        .limit(1);

      if (checkError) throw checkError;

      if (transactions && transactions.length > 0) {
        showToast(
          "Kategori ini memiliki transaksi. Tidak dapat dihapus.",
          "error"
        );
        return;
      }

      const { error } = await supabaseClient
        .from("categories")
        .delete()
        .eq("id", categoryId)
        .eq("user_id", user.id);

      if (error) throw error;

      setCategories(categories.filter((c) => c.id !== categoryId));
      showToast("Kategori berhasil dihapus!", "success");
      setIsDeleteOpen(false);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      showToast(error?.message || "Gagal menghapus kategori.", "error");
    }
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
              ? "Semua"
              : filterType === "income"
              ? "Pemasukan"
              : "Pengeluaran"}
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
        <span>Tambah Kategori</span>
      </button>

      {/* Categories List */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-12 text-center">
          <p className="text-slate-400">Belum ada kategori</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredCategories.map((category) => {
            const Icon = getCategoryIcon(category.icon, category.name);
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
                  <p
                    className={`text-xs font-semibold ${
                      category.type === "income"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </p>
                </div>

                {/* Actions */}
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
          })}
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
