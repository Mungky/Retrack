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
import EditTransactionSheet from "./EditTransactionSheet";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { isIncome, isExpense } from "@/lib/transaction-calc";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  const getCategoryStyle = (categoryName: string | null | undefined) => {
    if (!categoryName) {
      const txIsExpense = isExpense(transaction);
      return {
        icon: getTransactionIcon(),
        iconColor: getTransactionColor(),
        bgColor: txIsExpense ? "bg-rose-500/15" : "bg-emerald-500/15",
      };
    }

    const nameLower = categoryName.toLowerCase().trim();
    const categoryMap: Record<
      string,
      { icon: typeof Utensils; iconColor: string; bgColor: string }
    > = {
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
      // Income categories (bukan dollar)
      salary: { icon: Briefcase, iconColor: "text-emerald-500", bgColor: "bg-emerald-500/15" },
      bonus: { icon: Gift, iconColor: "text-amber-500", bgColor: "bg-amber-500/15" },
      investment: { icon: TrendingUp, iconColor: "text-teal-500", bgColor: "bg-teal-500/15" },
      freelance: { icon: Laptop, iconColor: "text-violet-500", bgColor: "bg-violet-500/15" },
      gift: { icon: Gift, iconColor: "text-rose-400", bgColor: "bg-rose-500/15" },
      business: { icon: Store, iconColor: "text-cyan-600", bgColor: "bg-cyan-500/15" },
      rental: { icon: Building2, iconColor: "text-blue-600", bgColor: "bg-blue-500/15" },
      interest: { icon: PiggyBank, iconColor: "text-green-500", bgColor: "bg-green-500/15" },
      dividend: { icon: Coins, iconColor: "text-indigo-500", bgColor: "bg-indigo-500/15" },
      sidejob: { icon: HandCoins, iconColor: "text-lime-500", bgColor: "bg-lime-500/15" },
    };

    if (categoryMap[nameLower]) return categoryMap[nameLower];
    if (nameLower.includes("food") || nameLower.includes("makanan")) return categoryMap.food;
    if (nameLower.includes("shopping") || nameLower.includes("belanja")) return categoryMap.shopping;
    if (nameLower.includes("transport")) return categoryMap.transport;
    if (nameLower.includes("bills") || nameLower.includes("tagihan")) return categoryMap.bills;
    if (nameLower.includes("health") || nameLower.includes("kesehatan")) return categoryMap.health;
    if (nameLower.includes("entertainment")) return categoryMap.entertainment;
    if (nameLower.includes("education")) return categoryMap.education;
    if (nameLower.includes("work") || nameLower.includes("kerja")) return categoryMap.work;
    if (nameLower.includes("coffee") || nameLower.includes("kopi")) return categoryMap.coffee;
    if (nameLower.includes("travel")) return categoryMap.travel;
    if (nameLower.includes("salary") || nameLower.includes("gaji")) return categoryMap.salary;
    if (nameLower.includes("bonus")) return categoryMap.bonus;
    if (nameLower.includes("invest") || nameLower.includes("investasi")) return categoryMap.investment;
    if (nameLower.includes("freelance")) return categoryMap.freelance;
    if (nameLower.includes("gift") || nameLower.includes("hadiah")) return categoryMap.gift;
    if (nameLower.includes("business") || nameLower.includes("bisnis")) return categoryMap.business;
    if (nameLower.includes("rental") || nameLower.includes("sewa")) return categoryMap.rental;
    if (nameLower.includes("interest") || nameLower.includes("bunga")) return categoryMap.interest;
    if (nameLower.includes("dividend") || nameLower.includes("dividen")) return categoryMap.dividend;
    if (nameLower.includes("side") || nameLower.includes("sampingan")) return categoryMap.sidejob;

    return { icon: Banknote, iconColor: "text-slate-400", bgColor: "bg-slate-500/15" };
  };

  const categoryStyle = transaction.category?.name
    ? getCategoryStyle(transaction.category.name)
    : {
        icon: getTransactionIcon(),
        iconColor: getTransactionColor(),
        bgColor:
          isExpense(transaction) ? "bg-rose-500/15" : "bg-emerald-500/15",
      };

  const CategoryIcon = categoryStyle.icon;
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
        className="fixed inset-0 z-[80]"
        onClick={() => setMenuOpen(false)}
      />
      <div
        className="fixed z-[90] fintech-card py-1 min-w-[130px] animate-fade-in"
        style={{
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
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors text-left"
        >
          <Pencil size={16} className="text-cyan-400" />
          Edit
        </button>
        <button
          onClick={() => {
            setMenuOpen(false);
            setIsDeleteOpen(true);
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors text-left"
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
        {/* Squircle icon - rounded square with soft colored bg */}
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-[12px] ${categoryStyle.bgColor} flex items-center justify-center`}
        >
          <CategoryIcon className={categoryStyle.iconColor} size={22} />
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
