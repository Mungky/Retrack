"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";
import { revalidateCategoryPaths } from "@/app/actions/categories";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { formThemes } from "@/lib/form-themes";
import { BaseSheet } from "@/components/shared/BaseSheet";
import { Button, Input } from "@/components/ui";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { REFRESH_CATEGORIES_EVENT } from "@/lib/app-events";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
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
  const router = useRouter();
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
      showToast(TOAST_MESSAGES.ERROR.VALIDATE_CATEGORY_NAME, "error");
      return;
    }
    if (!user?.id) {
      showToast(TOAST_MESSAGES.ERROR.USER_NOT_FOUND, "error");
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

      await revalidateCategoryPaths();
      showToast(
        category ? TOAST_MESSAGES.SUCCESS.CATEGORY_UPDATED : TOAST_MESSAGES.SUCCESS.CATEGORY_ADDED,
        "success"
      );
      window.dispatchEvent(new CustomEvent(REFRESH_CATEGORIES_EVENT));
      router.refresh();
      onSuccess(result);
      onClose();
    } catch (error: unknown) {
      console.error("Error saving category:", error);
      showToast(
        (error as { message?: string })?.message || TOAST_MESSAGES.ERROR.CATEGORY_SAVE_FAILED,
        "error"
      );
    }
  };

  return (
    <BaseSheet
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Edit Category" : "Add Category"}
      titleAccent={
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            type === "income" ? "bg-emerald-400" : "bg-rose-400"
          }`}
        />
      }
      nested
    >
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
              <p className="text-xs font-medium text-muted-foreground mb-3">
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
                    name={name || "Category"}
                    size={28}
                    style={{ color }}
                  />
                </div>
                <p className="text-foreground font-semibold truncate">
                  {name || "Category Name"}
                </p>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Category Name
              </label>
              <Input
                {...register("name", { required: "Name is required" })}
                type="text"
                placeholder="Category name"
              />
              {errors.name && (
                <p className="text-rose-400 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setValue("type", "expense")}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                    type === "expense"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-muted/50 text-muted-foreground border border-border"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setValue("type", "income")}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                    type === "income"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-muted/50 text-muted-foreground border border-border"
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                      : "bg-muted/50 text-muted-foreground border border-border"
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
                      : "bg-muted/50 text-muted-foreground border border-border"
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
                              : "bg-muted/50 border-border"
                          }`}
                        >
                          <IconC
                            className={`mx-auto ${
                              isSelected
                                ? type === "income"
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                                : "text-muted-foreground"
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
                      placeholder="e.g. 🍕 🚗 💼"
                      className={`w-full rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-2 text-2xl text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-b-primary focus:border-b-2 transition-colors ${theme.inputFocus}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Color
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setColorTab("presets")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    colorTab === "presets"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-muted/50 text-muted-foreground border border-border"
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
                      : "bg-muted/50 text-muted-foreground border border-border"
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
                      className={`flex-1 rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-b-primary focus:border-b-2 transition-colors ${theme.inputFocus}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
            >
              {category ? "Update Category" : "Add Category"}
            </Button>
          </form>
    </BaseSheet>
  );
}
