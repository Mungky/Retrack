"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ShoppingBag, Utensils, Car, Home, Heart, Gamepad2, GraduationCap, Briefcase, Coffee, Plane, Receipt, Banknote, Laptop, TrendingUp, Gift, Building2, PiggyBank, Store, HandCoins, Coins } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { formThemes } from "@/lib/form-themes";
import type { Category, CategoryType } from "@/types";

interface CategoryFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: (category: Category) => void;
}

const ICONS = [
  // Expense
  { name: "food", component: Utensils },
  { name: "shopping", component: ShoppingBag },
  { name: "transport", component: Car },
  { name: "bills", component: Home },
  { name: "health", component: Heart },
  { name: "entertainment", component: Gamepad2 },
  { name: "education", component: GraduationCap },
  { name: "coffee", component: Coffee },
  { name: "travel", component: Plane },
  // Income
  { name: "salary", component: Briefcase },
  { name: "freelance", component: Laptop },
  { name: "investment", component: TrendingUp },
  { name: "bonus", component: Gift },
  { name: "gift", component: Gift },
  { name: "business", component: Store },
  { name: "rental", component: Building2 },
  { name: "interest", component: PiggyBank },
  { name: "dividend", component: Coins },
  { name: "sidejob", component: HandCoins },
  // General
  { name: "work", component: Briefcase },
  { name: "receipt", component: Receipt },
];

const COLORS = [
  "#06b6d4", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#ef4444", "#14b8a6", "#6366f1", "#a855f7",
];

export default function CategoryFormSheet({
  isOpen,
  onClose,
  category,
  onSuccess,
}: CategoryFormSheetProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [name, setName] = useState(category?.name || "");
  const [selectedIcon, setSelectedIcon] = useState<string>(
    category?.icon || "receipt"
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    category?.color || COLORS[0]
  );
  const [type, setType] = useState<CategoryType>(category?.type || "expense");
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic theme based on selected category type
  const theme = formThemes[type === "income" ? "emerald" : "rose"];

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (category) {
        // Editing existing category – populate fields
        setName(category.name);
        setSelectedIcon(category.icon || "receipt");
        setSelectedColor(category.color || COLORS[0]);
        setType(category.type || "expense");
      } else {
        // Adding new category – reset to defaults
        setName("");
        setSelectedIcon("receipt");
        setSelectedColor(COLORS[0]);
        setType("expense");
      }
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, category, setIsSheetOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Nama kategori tidak boleh kosong.", "error");
      return;
    }

    if (!user?.id) {
      showToast("User tidak ditemukan.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const categoryData = {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type,
        user_id: user.id,
      };

      let result;
      if (category) {
        const { data, error } = await supabaseClient
          .from("categories")
          .update(categoryData)
          .eq("id", category.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseClient
          .from("categories")
          .insert([categoryData])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      showToast(
        `Kategori berhasil ${category ? "diupdate" : "ditambahkan"}!`,
        "success"
      );
      onSuccess(result);
      onClose();
    } catch (error: any) {
      console.error("Error saving category:", error);
      showToast(error?.message || "Gagal menyimpan kategori.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 z-[60] transition-opacity duration-300"
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
              <div className={`w-2 h-2 rounded-full transition-colors ${type === "income" ? "bg-emerald-400" : "bg-rose-400"}`} />
              <h2 className="text-xl font-bold text-white">
                {category ? "Edit Kategori" : "Tambah Kategori"}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Nama Kategori
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kategori"
              className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all ${theme.inputFocus}`}
            />
          </div>

          {/* Type Toggle - themed */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                type === "expense"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-white/5 text-slate-400 border border-white/10"
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                type === "income"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-slate-400 border border-white/10"
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Icon - themed selection */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-3">
              {ICONS.map((icon) => {
                const IconComponent = icon.component;
                const isSelected = selectedIcon === icon.name;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? `${type === "income" ? "bg-emerald-500/20 border-emerald-500/50" : "bg-rose-500/20 border-rose-500/50"}`
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <IconComponent
                      className={`mx-auto flex-shrink-0 ${
                        isSelected
                          ? type === "income" ? "text-emerald-400" : "text-rose-400"
                          : "text-slate-400"
                      }`}
                      size={24}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Warna
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-full h-12 rounded-xl border-2 transition-all ${
                    selectedColor === color
                      ? "border-white scale-110"
                      : "border-slate-800"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Submit - dynamically themed based on category type */}
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
              category ? "Update Kategori" : "Tambah Kategori"
            )}
          </button>
        </form>
        </div>
      </div>
    </>
  );
}
