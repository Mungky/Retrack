"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ShoppingBag, Utensils, Car, Home, Heart, Gamepad2, GraduationCap, Briefcase, Coffee, Plane, Receipt } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import type { Category, CategoryType } from "@/types";

interface CategoryFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: (category: Category) => void;
}

const ICONS = [
  { name: "shopping", component: ShoppingBag },
  { name: "food", component: Utensils },
  { name: "transport", component: Car },
  { name: "bills", component: Home },
  { name: "health", component: Heart },
  { name: "entertainment", component: Gamepad2 },
  { name: "education", component: GraduationCap },
  { name: "work", component: Briefcase },
  { name: "coffee", component: Coffee },
  { name: "travel", component: Plane },
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

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (category) {
        setName(category.name);
        setSelectedIcon(category.icon || "receipt");
        setSelectedColor(category.color || COLORS[0]);
        setType(category.type || 'expense');
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
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-h-[90vh] bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {category ? "Edit Kategori" : "Tambah Kategori"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="text-slate-400" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nama Kategori
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kategori"
              className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Type */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                type === "expense"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-slate-900/50 text-slate-400 border border-slate-800"
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
                  : "bg-slate-900/50 text-slate-400 border border-slate-800"
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
                        ? "bg-cyan-500/20 border-cyan-500/50"
                        : "bg-slate-900/50 border-slate-800"
                    }`}
                  >
                    <IconComponent
                      className={`mx-auto flex-shrink-0 ${
                        isSelected ? "text-cyan-400" : "text-slate-400"
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
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  );
}
