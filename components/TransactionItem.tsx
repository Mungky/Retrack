"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  MoreVertical,
  Pencil,
  Trash2,
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
  Gift,
  Laptop,
  TrendingUp,
  Building2,
  PiggyBank,
  Store,
  Coins,
  HandCoins,
} from "lucide-react";
import { CategoryIconDisplay } from "@/components/shared/CategoryIconDisplay";
import EditTransactionSheet from "./EditTransactionSheet";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { isIncome, isExpense } from "@/lib/transaction-calc";
import { formatCurrency } from "@/lib/currency";
import { Z_INDEX } from "@/lib/z-index";
import type { Transaction } from "@/types";

interface TransactionItemProps {
  transaction: Transaction;
  /** When true, dropdown opens upwards to avoid clipping by bottom nav */
  isLastItem?: boolean;
}

export default function TransactionItem({ transaction, isLastItem = false }: TransactionItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const getTransactionIcon = () => {
    if (isIncome(transaction)) return ArrowUpCircle;
    if (transaction.type === "transfer") return ArrowRightLeft;
    return ArrowDownCircle;
  };

  const getTransactionColor = () => {
    if (isIncome(transaction)) return "text-emerald-400";
    if (transaction.type === "transfer") return "text-blue-400";
    return "text-rose-500";
  };

  const getAmountColor = () => {
    if (isIncome(transaction)) return "text-emerald-400";
    if (isExpense(transaction)) return "text-rose-500";
    return "text-white";
  };

  const getTransactionLabel = () => {
    if (isIncome(transaction)) {
      return (
        transaction.destination_wallet?.name ||
        transaction.destination_wallet_id ||
        "Income"
      );
    }
    if (transaction.type === "transfer") {
      return `${transaction.source_wallet?.name || ""} → ${
        transaction.destination_wallet?.name || ""
      }`;
    }
    return (
      transaction.source_wallet?.name ||
      transaction.source_wallet_id ||
      "Expense"
    );
  };

  const cat = transaction.category;
  const catColor = cat?.color || "#06b6d4";
  const title = transaction.description?.trim() || transaction.category?.name || getTransactionLabel();
  const subtitle = `${formatDate(transaction.date)} · ${transaction.category?.name || getTransactionLabel()}`;

  useEffect(() => {
    if (menuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      if (isLastItem) {
        setMenuPosition({
          top: rect.top - 8,
          left: rect.right - 130,
        });
      } else {
        setMenuPosition({
          top: rect.bottom + 4,
          left: rect.right - 130,
        });
      }
    }
  }, [menuOpen, isLastItem]);

  const dropdownContent = menuOpen && (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: Z_INDEX.sheetNested }}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className="fixed bg-card border border-border rounded-xl py-1 min-w-[130px] shadow-xl animate-fade-in"
        style={{
          zIndex: Z_INDEX.dropdown,
          top: menuPosition.top,
          left: menuPosition.left,
          transform: isLastItem ? "translateY(-100%)" : "none",
        }}
      >
        <button
          onClick={() => {
            setMenuOpen(false);
            setIsEditOpen(true);
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
        >
          <Pencil size={16} className="text-cyan-400" />
          Edit
        </button>
        <button
          onClick={() => {
            setMenuOpen(false);
            setIsDeleteOpen(true);
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
        >
          <Trash2 size={16} className="text-rose-400" />
          Delete
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center gap-4 py-4 px-4">
        {/* Squircle icon - use category icon+color from DB when available */}
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-[12px] flex items-center justify-center ${
            cat ? "" : isExpense(transaction) ? "bg-rose-500/15" : "bg-emerald-500/15"
          }`}
          style={cat ? { backgroundColor: `${catColor}20` } : undefined}
        >
          {cat ? (
            <CategoryIconDisplay
              icon={cat.icon}
              name={cat.name}
              size={22}
              style={{ color: catColor }}
            />
          ) : (
            (() => {
              const DefaultIcon = getTransactionIcon();
              return <DefaultIcon className={getTransactionColor()} size={22} />;
            })()
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{title}</h3>
          <p className="text-sm text-white/50 truncate">{subtitle}</p>
        </div>

        {/* Amount - right aligned */}
        <p className={`font-bold ${getAmountColor()} flex-shrink-0`}>
          {isExpense(transaction) ? "-" : isIncome(transaction) ? "+" : ""}
          {formatCurrency(transaction.amount)}
        </p>

        {/* Three-dot menu - always visible */}
        <div className="relative flex-shrink-0">
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            <MoreVertical className="text-white/50" size={20} />
          </button>

          {typeof document !== "undefined" &&
            createPortal(dropdownContent, document.body)}
        </div>
      </div>

      <EditTransactionSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        transaction={transaction}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        transactionId={transaction.id}
      />
    </>
  );
}
