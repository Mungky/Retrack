"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Z_INDEX } from "@/lib/z-index";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui";
import CategoryFormSheet from "./CategoryFormSheet";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Category } from "@/types";

interface CategoryManagerProps {
  initialCategories: Category[];
  onClose?: () => void;
  onCategoriesChange?: (categories: Category[]) => void;
}

type TabType = "income" | "expense";

export default function CategoryManager({
  initialCategories,
  onClose,
  onCategoriesChange,
}: CategoryManagerProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<TabType>("expense");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const filteredCategories = categories.filter((cat) => {
    const effectiveType = (cat.type || "expense").toLowerCase();
    return effectiveType === activeTab;
  });

  const isLastCategory = menuOpenId
    ? filteredCategories.findIndex((c) => c.id === menuOpenId) === filteredCategories.length - 1
    : false;

  useEffect(() => {
    if (menuOpenId && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      if (isLastCategory) {
        setMenuPosition({ top: rect.top - 8, left: rect.right - 130 });
      } else {
        setMenuPosition({ top: rect.bottom + 4, left: rect.right - 130 });
      }
    }
  }, [menuOpenId, isLastCategory]);

  const handleDelete = async (categoryId: string) => {
    if (!user?.id) return;

    setIsDeleting(true);
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
        setIsDeleting(false);
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
        setIsDeleting(false);
        setIsDeleteOpen(false);
        return;
      }

      const { error } = await supabaseClient
        .from("categories")
        .delete()
        .eq("id", categoryId)
        .eq("user_id", user.id);

      if (error) throw error;

      const next = categories.filter((c) => c.id !== categoryId);
      setCategories(next);
      onCategoriesChange?.(next);
      showToast(TOAST_MESSAGES.SUCCESS.CATEGORY_DELETED, "success");
      setIsDeleteOpen(false);
    } catch (error: unknown) {
      console.error("Error deleting category:", error);
      showToast(
        (error as { message?: string })?.message || TOAST_MESSAGES.ERROR.CATEGORY_DELETE_FAILED,
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCategoryCard = (category: Category) => {
    return (
      <motion.div
        key={category.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group relative overflow-hidden rounded-2xl bg-card border border-border p-4 hover:border-primary/30 transition-all flex items-center gap-4"
      >
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{
            backgroundColor: category.color
              ? `${category.color}20`
              : "rgba(6, 182, 212, 0.2)",
          }}
        >
          <CategoryIconDisplay
            icon={category.icon}
            name={category.name}
            size={24}
            style={{ color: category.color || "#06b6d4" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-card-foreground font-semibold truncate">{category.name}</h3>
        </div>
        <div className="relative flex-shrink-0">
          <button
            ref={menuOpenId === category.id ? menuButtonRef : undefined}
            onClick={() => setMenuOpenId(menuOpenId === category.id ? null : category.id)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Menu"
          >
            <MoreVertical className="text-muted-foreground" size={20} />
          </button>
          {menuOpenId === category.id &&
            typeof document !== "undefined" &&
            createPortal(
              <>
                <div
                  className="fixed inset-0"
                  style={{ zIndex: Z_INDEX.sheetNested }}
                  onClick={() => setMenuOpenId(null)}
                />
                <div
                  className="fixed fintech-card py-1 min-w-[130px] animate-fade-in"
                  style={{
                    zIndex: Z_INDEX.dropdown,
                    top: menuPosition.top,
                    left: menuPosition.left,
                    transform: isLastCategory ? "translateY(-100%)" : "none",
                  }}
                >
                  <button
                    onClick={() => {
                      setMenuOpenId(null);
                      setSelectedCategory(category);
                      setIsFormOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Pencil size={16} className="text-primary" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpenId(null);
                      setSelectedCategory(category);
                      setIsDeleteOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Trash2 size={16} className="text-rose-400" />
                    Delete
                  </button>
                </div>
              </>,
              document.body
            )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Row: Add Category (left) | Toggle Expense/Income (right) - thumb-friendly */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            setSelectedCategory(null);
            setIsFormOpen(true);
          }}
          className="flex-1 justify-center"
        >
          <Plus size={18} />
          Add Category
        </Button>
        <div className="flex rounded-xl border border-border bg-card p-1">
          {(["expense", "income"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeTab === tab
                  ? tab === "income"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "income" ? "Income" : "Expense"}
            </button>
          ))}
        </div>
      </div>

      {/* Category List */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-10 text-center">
          <p className="text-muted-foreground text-sm">
            No {activeTab} categories yet
          </p>
          <p className="text-muted-foreground/80 text-xs mt-1">
            Tap &quot;Add Category&quot; above
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredCategories.map((cat) => renderCategoryCard(cat))}
          </div>
        </AnimatePresence>
      )}

      {/* Form Sheet */}
      <CategoryFormSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={(newCategory) => {
          const next = selectedCategory
            ? categories.map((c) => (c.id === selectedCategory.id ? newCategory : c))
            : [...categories, newCategory];
          setCategories(next);
          onCategoriesChange?.(next);
          setIsFormOpen(false);
          setSelectedCategory(null);
        }}
      />

      {selectedCategory && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedCategory(null);
          }}
          title="Delete Category"
          description="Are you sure you want to delete this category? This action cannot be undone."
          onConfirm={() => handleDelete(selectedCategory.id)}
          isLoading={isDeleting}
          variant="danger"
          confirmLabel="Delete"
        />
      )}
    </div>
  );
}
