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
      const { data: transactions, error: checkError } = await supabaseClient
        .from("transactions")
        .select("id")
        .eq("category_id", categoryId)
        .eq("user_id", user.id)
        .limit(1);

      if (checkError) throw checkError;

      if (transactions && transactions.length > 0) {
        showToast(TOAST_MESSAGES.ERROR.CATEGORY_HAS_TRANSACTIONS, "error");
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
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 border border-slate-800 p-4 hover:border-slate-700 transition-all flex items-center gap-4"
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
          <h3 className="text-white font-semibold truncate">{category.name}</h3>
        </div>
        <div className="relative flex-shrink-0">
          <button
            ref={menuOpenId === category.id ? menuButtonRef : undefined}
            onClick={() => setMenuOpenId(menuOpenId === category.id ? null : category.id)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            <MoreVertical className="text-white/50" size={20} />
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
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <Pencil size={16} className="text-cyan-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpenId(null);
                      setSelectedCategory(category);
                      setIsDeleteOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors text-left"
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
      {/* Tabs */}
      <div className="flex gap-2 px-1">
        {(["expense", "income"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === tab
                ? tab === "income"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-slate-900/50 text-slate-400 border border-slate-800"
            }`}
          >
            {tab === "income" ? "Income" : "Expense"}
          </button>
        ))}
      </div>

      {/* Add Category Button - same style as Add Wallet */}
      <Button
        onClick={() => {
          setSelectedCategory(null);
          setIsFormOpen(true);
        }}
        className="w-full"
      >
        <Plus size={18} />
        Add Category
      </Button>

      {/* Category List */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-10 text-center">
          <p className="text-slate-400 text-sm">
            No {activeTab} categories yet
          </p>
          <p className="text-slate-500 text-xs mt-1">
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
          title="Hapus Kategori"
          description="Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan."
          onConfirm={() => handleDelete(selectedCategory.id)}
          isLoading={isDeleting}
          variant="danger"
          confirmLabel="Hapus"
        />
      )}
    </div>
  );
}
