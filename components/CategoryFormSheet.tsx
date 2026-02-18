"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Heart,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Coffee,
  Plane,
  Receipt,
  Laptop,
  TrendingUp,
  Gift,
  Building2,
  PiggyBank,
  Store,
  HandCoins,
  Coins,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { formThemes } from "@/lib/form-themes";
import { REFRESH_CATEGORIES_EVENT } from "@/lib/app-events";
import { CategoryIconDisplay } from "./AddTransactionSheet";
import type { Category, CategoryType } from "@/types";

interface CategoryFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: (category: Category) => void;
}

type IconTab = "presets" | "emoji";
type ColorTab = "presets" | "custom";

const LUCIDE_PRESETS = [
  { name: "shopping", component: ShoppingBag },
  { name: "food", component: Utensils },
  { name: "transport", component: Car },
  { name: "bills", component: Home },
  { name: "health", component: Heart },
  { name: "entertainment", component: Gamepad2 },
  { name: "education", component: GraduationCap },
  { name: "coffee", component: Coffee },
  { name: "travel", component: Plane },
  { name: "receipt", component: Receipt },
  { name: "salary", component: Briefcase },
  { name: "freelance", component: Laptop },
  { name: "investment", component: TrendingUp },
  { name: "gift", component: Gift },
  { name: "business", component: Store },
  { name: "rental", component: Building2 },
  { name: "interest", component: PiggyBank },
  { name: "dividend", component: Coins },
  { name: "sidejob", component: HandCoins },
];

const COLOR_PRESETS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

type FormValues = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
};

export default function CategoryFormSheet({
  isOpen,
  onClose,
  category,
  onSuccess,
}: CategoryFormSheetProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [iconTab, setIconTab] = useState<IconTab>("presets");
  const [colorTab, setColorTab] = useState<ColorTab>("presets");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      type: "expense",
      icon: "receipt",
      color: "#06b6d4",
    },
  });

  const name = watch("name");
  const type = watch("type");
  const icon = watch("icon");
  const color = watch("color");

  const theme = formThemes[type === "income" ? "emerald" : "rose"];

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (category) {
        reset({
          name: category.name,
          type: (category.type || "expense") as CategoryType,
          icon: category.icon || "receipt",
          color: category.color || "#06b6d4",
        });
        setIconTab(
          category.icon && !/^[a-z0-9_-]+$/i.test(category.icon)
            ? "emoji"
            : "presets"
        );
        setColorTab("presets");
      } else {
        reset({
          name: "",
          type: "expense",
          icon: "receipt",
          color: "#06b6d4",
        });
        setIconTab("presets");
        setColorTab("presets");
      }
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, category, reset, setIsSheetOpen]);

  const onSubmit = async (data: FormValues) => {
    if (!data.name.trim()) {
      showToast("Nama kategori tidak boleh kosong.", "error");
      return;
    }
    if (!user?.id) {
      showToast("User tidak ditemukan.", "error");
      return;
    }

    try {
      const categoryData = {
        name: data.name.trim(),
        icon: data.icon,
        color: data.color,
        type: data.type,
        user_id: user.id,
        is_custom: true,
      };

      let result: Category;
      if (category) {
        const { data: updated, error } = await supabaseClient
          .from("categories")
          .update(categoryData)
          .eq("id", category.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        result = updated as Category;
      } else {
        const { data: inserted, error } = await supabaseClient
          .from("categories")
          .insert([categoryData])
          .select()
          .single();
        if (error) throw error;
        result = inserted as Category;
      }

      showToast(
        `Kategori berhasil ${category ? "diupdate" : "ditambahkan"}!`,
        "success"
      );
      window.dispatchEvent(new CustomEvent(REFRESH_CATEGORIES_EVENT));
      onSuccess(result);
      onClose();
    } catch (error: unknown) {
      console.error("Error saving category:", error);
      showToast(
        (error as { message?: string })?.message || "Gagal menyimpan kategori.",
        "error"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 z-[80] transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[80] animate-in">
        <div
          className="mx-auto max-w-2xl rounded-t-3xl rounded-b-none bg-[#181A25] border-t border-x border-white/10 shadow-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  type === "income" ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
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
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-6 overflow-y-auto"
            style={{
              maxHeight: "calc(90vh - 140px)",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            {/* Live Preview Card */}
            <div
              className={`p-4 rounded-2xl border ${
                type === "income"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-rose-500/5 border-rose-500/20"
              }`}
            >
              <p className="text-xs font-medium text-white/50 mb-3">
                Preview
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{
                    backgroundColor: `${color}20`,
                  }}
                >
                  <CategoryIconDisplay
                    icon={icon}
                    name={name || "Kategori"}
                    size={28}
                    style={{ color }}
                  />
                </div>
                <p className="text-white font-semibold truncate">
                  {name || "Nama Kategori"}
                </p>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Nama Kategori
              </label>
              <input
                {...register("name", { required: "Nama harus diisi" })}
                type="text"
                placeholder="Nama kategori"
                className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all ${theme.inputFocus}`}
              />
              {errors.name && (
                <p className="text-rose-400 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Tipe
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setValue("type", "expense")}
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
                  onClick={() => setValue("type", "income")}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                    type === "income"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  Pemasukan
                </button>
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Icon
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setIconTab("presets");
                    if (icon && !/^[a-z0-9_-]+$/i.test(icon)) setValue("icon", "receipt");
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    iconTab === "presets"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIconTab("emoji");
                    if (icon && /^[a-z0-9_-]+$/i.test(icon)) setValue("icon", "");
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    iconTab === "emoji"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  Custom Emoji
                </button>
              </div>
              <AnimatePresence mode="wait">
                {iconTab === "presets" ? (
                  <motion.div
                    key="presets"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-5 gap-2"
                  >
                    {LUCIDE_PRESETS.map((item) => {
                      const IconC = item.component;
                      const isSelected = icon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setValue("icon", item.name)}
                          className={`p-3 rounded-xl border transition-all ${
                            isSelected
                              ? type === "income"
                                ? "bg-emerald-500/20 border-emerald-500/50"
                                : "bg-rose-500/20 border-rose-500/50"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <IconC
                            className={`mx-auto ${
                              isSelected
                                ? type === "income"
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                                : "text-slate-400"
                            }`}
                            size={22}
                          />
                        </button>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="emoji"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <input
                      {...register("icon")}
                      type="text"
                      placeholder="Misal: 🍕 🚗 💼"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all text-2xl text-center"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Warna
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setColorTab("presets")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    colorTab === "presets"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setColorTab("custom")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    colorTab === "custom"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  Custom
                </button>
              </div>
              <AnimatePresence mode="wait">
                {colorTab === "presets" ? (
                  <motion.div
                    key="color-presets"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-4 gap-3"
                  >
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setValue("color", c)}
                        className={`w-full aspect-square rounded-full border-2 transition-all ${
                          color === c ? "border-white scale-110" : "border-slate-800"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="color-custom"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-4"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setValue("color", e.target.value)}
                      className="w-14 h-14 rounded-xl cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setValue("color", e.target.value)}
                      placeholder="#FF0000"
                      className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all font-mono text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`w-full py-4 rounded-2xl ${theme.submitGradient} text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ boxShadow: theme.submitShadow }}
            >
              {category ? "Update Kategori" : "Tambah Kategori"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
