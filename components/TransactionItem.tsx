"use client";

import { useState } from "react";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ArrowRightLeft, 
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
  Home,
  Banknote,
  Receipt
} from "lucide-react";
import EditTransactionSheet from "./EditTransactionSheet";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import type { Transaction } from "@/types";

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTransactionIcon = () => {
    if (transaction.type === "income") {
      return ArrowUpCircle;
    } else if (transaction.type === "transfer") {
      return ArrowRightLeft;
    }
    return ArrowDownCircle;
  };

  const getTransactionColor = () => {
    if (transaction.type === "income") {
      return "text-emerald-400";
    } else if (transaction.type === "transfer") {
      return "text-cyan-400";
    }
    return "text-red-400";
  };

  const getTransactionLabel = () => {
    if (transaction.type === "income") {
      return transaction.destination_wallet?.name || "Income";
    } else if (transaction.type === "transfer") {
      return `${transaction.source_wallet?.name || ""} → ${transaction.destination_wallet?.name || ""}`;
    }
    return transaction.source_wallet?.name || "Expense";
  };

  // Helper function to get category style (icon + color)
  const getCategoryStyle = (categoryName: string | null | undefined) => {
    if (!categoryName) {
      return {
        icon: getTransactionIcon(),
        iconColor: getTransactionColor(),
        bgColor: "bg-slate-800/50"
      };
    }

    const nameLower = categoryName.toLowerCase().trim();
    
    // Mapping kategori ke icon dan warna
    const categoryMap: { [key: string]: { icon: any; iconColor: string; bgColor: string } } = {
      'food': {
        icon: Utensils,
        iconColor: 'text-orange-500',
        bgColor: 'bg-orange-500/10'
      },
      'shopping': {
        icon: ShoppingBag,
        iconColor: 'text-pink-500',
        bgColor: 'bg-pink-500/10'
      },
      'transport': {
        icon: Car,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-500/10'
      },
      'bills': {
        icon: Zap,
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10'
      },
      'health': {
        icon: HeartPulse,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-500/10'
      },
      'entertainment': {
        icon: Gamepad2,
        iconColor: 'text-purple-500',
        bgColor: 'bg-purple-500/10'
      },
      'education': {
        icon: GraduationCap,
        iconColor: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10'
      },
      'work': {
        icon: Briefcase,
        iconColor: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10'
      },
      'coffee': {
        icon: Coffee,
        iconColor: 'text-amber-600',
        bgColor: 'bg-amber-600/10'
      },
      'travel': {
        icon: Plane,
        iconColor: 'text-sky-500',
        bgColor: 'bg-sky-500/10'
      },
    };

    // Exact match
    if (categoryMap[nameLower]) {
      return categoryMap[nameLower];
    }

    // Partial match
    if (nameLower.includes('food') || nameLower.includes('makanan') || nameLower.includes('restaurant')) {
      return categoryMap['food'];
    }
    if (nameLower.includes('shopping') || nameLower.includes('belanja')) {
      return categoryMap['shopping'];
    }
    if (nameLower.includes('transport') || nameLower.includes('transportasi') || nameLower.includes('car')) {
      return categoryMap['transport'];
    }
    if (nameLower.includes('bills') || nameLower.includes('tagihan') || nameLower.includes('utilities')) {
      return categoryMap['bills'];
    }
    if (nameLower.includes('health') || nameLower.includes('kesehatan') || nameLower.includes('medical')) {
      return categoryMap['health'];
    }
    if (nameLower.includes('entertainment') || nameLower.includes('hiburan') || nameLower.includes('game')) {
      return categoryMap['entertainment'];
    }
    if (nameLower.includes('education') || nameLower.includes('pendidikan') || nameLower.includes('school')) {
      return categoryMap['education'];
    }
    if (nameLower.includes('work') || nameLower.includes('kerja') || nameLower.includes('business')) {
      return categoryMap['work'];
    }
    if (nameLower.includes('coffee') || nameLower.includes('kopi') || nameLower.includes('cafe')) {
      return categoryMap['coffee'];
    }
    if (nameLower.includes('travel') || nameLower.includes('perjalanan') || nameLower.includes('trip')) {
      return categoryMap['travel'];
    }

    // Default
    return {
      icon: Banknote,
      iconColor: 'text-slate-500',
      bgColor: 'bg-slate-500/10'
    };
  };

  // Get category style or fallback to transaction style
  const categoryStyle = transaction.category?.name
    ? getCategoryStyle(transaction.category.name)
    : {
        icon: getTransactionIcon(),
        iconColor: getTransactionColor(),
        bgColor: "bg-slate-800/50"
      };

  const CategoryIcon = categoryStyle.icon;
  const iconColor = categoryStyle.iconColor;
  const bgColor = categoryStyle.bgColor;

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 border border-slate-800 p-4 hover:border-slate-700 transition-all">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-xl ${bgColor} border border-white/5`}>
            <CategoryIcon className={iconColor} size={24} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">
              {transaction.category?.name || getTransactionLabel()}
            </h3>
            <p className="text-sm text-slate-400 truncate">
              {getTransactionLabel()}
            </p>
          </div>

          {/* Amount */}
          <div className="text-right">
            <p className={`font-bold ${getTransactionColor()}`}>
              {transaction.type === "expense" ? "-" : transaction.type === "income" ? "+" : ""}
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Pencil className="text-cyan-400" size={16} />
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="text-red-400" size={16} />
            </button>
          </div>
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
