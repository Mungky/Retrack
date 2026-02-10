"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowDownCircle, ArrowUpCircle, ShoppingBag, Utensils, Car, Home, Heart, HeartPulse, Gamepad2, GraduationCap, Briefcase, Coffee, Plane, Loader2, Receipt, Zap, Banknote, Calendar } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import type { Category, Wallet } from "@/types";

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapping for database categories
export const ICON_MAP: { [key: string]: any } = {
  shopping: ShoppingBag,
  food: Utensils,
  transport: Car,
  bills: Home,
  health: Heart,
  entertainment: Gamepad2,
  education: GraduationCap,
  work: Briefcase,
  coffee: Coffee,
  travel: Plane,
  receipt: Receipt,
};

// Helper to get icon by category name as fallback
const getIconByName = (categoryName: string): any => {
  if (!categoryName) return Receipt;
  
  const nameLower = categoryName.toLowerCase().trim();
  
  // Exact match first (case-insensitive)
  const exactMatchMap: { [key: string]: any } = {
    'food': Utensils,
    'shopping': ShoppingBag,
    'transport': Car,
    'bills': Home,
    'health': Heart,
    'entertainment': Gamepad2,
    'education': GraduationCap,
    'work': Briefcase,
    'coffee': Coffee,
    'travel': Plane,
  };
  
  if (exactMatchMap[nameLower]) {
    return exactMatchMap[nameLower];
  }
  
  // Partial match
  if (nameLower.includes('food') || nameLower.includes('makanan') || nameLower.includes('restaurant')) {
    return Utensils;
  }
  if (nameLower.includes('shopping') || nameLower.includes('belanja')) {
    return ShoppingBag;
  }
  if (nameLower.includes('transport') || nameLower.includes('transportasi') || nameLower.includes('car')) {
    return Car;
  }
  if (nameLower.includes('bills') || nameLower.includes('tagihan') || nameLower.includes('utilities')) {
    return Home;
  }
  if (nameLower.includes('health') || nameLower.includes('kesehatan') || nameLower.includes('medical')) {
    return Heart;
  }
  if (nameLower.includes('entertainment') || nameLower.includes('hiburan') || nameLower.includes('game')) {
    return Gamepad2;
  }
  if (nameLower.includes('education') || nameLower.includes('pendidikan') || nameLower.includes('school')) {
    return GraduationCap;
  }
  if (nameLower.includes('work') || nameLower.includes('kerja') || nameLower.includes('business')) {
    return Briefcase;
  }
  if (nameLower.includes('coffee') || nameLower.includes('kopi') || nameLower.includes('cafe')) {
    return Coffee;
  }
  if (nameLower.includes('travel') || nameLower.includes('perjalanan') || nameLower.includes('trip')) {
    return Plane;
  }
  
  return Receipt; // Default
};

export const getCategoryIcon = (iconName: string | null, categoryName?: string) => {
  // First try to use icon from database
  if (iconName) {
    const iconKey = iconName.toLowerCase().trim();
    const icon = ICON_MAP[iconKey];
    if (icon) {
      return icon;
    }
  }
  
  // Fallback: use category name to determine icon
  if (categoryName) {
    return getIconByName(categoryName);
  }
  
  // Last resort: default icon
  return Receipt;
};

// Helper function to get category style (icon + color) for UI display
export const getCategoryStyle = (categoryName: string | null | undefined) => {
  if (!categoryName) {
    return {
      icon: Receipt,
      iconColor: 'text-slate-400',
      bgColor: 'bg-slate-500/10'
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

export default function AddTransactionSheet({ isOpen, onClose }: AddTransactionSheetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [amount, setAmount] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Memoize category styles to prevent recalculation on every render
  const categoryStylesMap = useMemo(() => {
    const map = new Map<string, { icon: any; iconColor: string; bgColor: string }>();
    categories.forEach((category) => {
      map.set(category.id, getCategoryStyle(category.name));
    });
    return map;
  }, [categories]);

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (user?.id) {
        fetchWallets();
        fetchCategories();
      }
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, user?.id, setIsSheetOpen]);

  useEffect(() => {
    return () => {
      setIsSheetOpen(false);
    };
  }, [setIsSheetOpen]);

  const fetchWallets = async () => {
    if (!user?.id) {
      showToast("User tidak ditemukan. Silakan login terlebih dahulu.", "error");
      return;
    }

    try {
      setIsLoadingWallets(true);
      const { data, error } = await supabaseClient
        .from("wallets")
        .select("id, name, balance, type, user_id")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setWallets(data as Wallet[]);
        // Set first wallet as default if no wallet selected
        if (!selectedWallet) {
          setSelectedWallet(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
      showToast("Gagal memuat data wallet. Silakan coba lagi.", "error");
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const fetchCategories = async () => {
    if (!user?.id) {
      setCategories([]);
      return;
    }

    try {
      setIsLoadingCategories(true);
      const { data, error } = await supabaseClient
        .from("categories")
        .select("id, name, icon")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
        return;
      }

      if (data && data.length > 0) {
        setCategories(data);
      } else {
        // If no categories found, set empty array
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(numericValue));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      showToast("User tidak ditemukan. Silakan login terlebih dahulu.", "error");
      return;
    }

    // Validation
    if (!amount || parseInt(amount.replace(/\D/g, "")) === 0) {
      showToast("Mohon masukkan nominal yang valid", "error");
      return;
    }

    if (!selectedCategory) {
      showToast("Mohon pilih kategori", "error");
      return;
    }

    if (!selectedWallet) {
      showToast("Mohon pilih wallet", "error");
      return;
    }

    try {
      setIsLoading(true);

      // Get selected wallet
      const selectedWalletData = wallets.find(w => w.id === selectedWallet);
      
      if (!selectedWalletData) {
        throw new Error("Wallet tidak ditemukan");
      }

      // Find category_id from categories table
      let categoryId: string | null = null;
      if (selectedCategory) {
        const foundCategory = categories.find(cat => 
          cat.name.toLowerCase() === selectedCategory.toLowerCase() || 
          cat.id === selectedCategory
        );
        if (foundCategory) {
          categoryId = foundCategory.id;
        } else {
          categoryId = selectedCategory;
        }
      }

      // Build transaction data
      const transactionData: any = {
        amount: parseInt(amount.replace(/\D/g, "")),
        type: isIncome ? "income" : "expense",
        date: selectedDate,
        category_id: categoryId,
        user_id: user.id, // Use authenticated user ID
        source_wallet_id: selectedWallet,
      };

      // Income and expense both use source_wallet_id in current schema.
      transactionData.destination_wallet_id = null;

      // Wallet balance updates are handled by database trigger.
      const { data, error } = await supabaseClient
        .from("transactions")
        .insert([transactionData])
        .select();

      if (error) {
        // Log full error object
        console.error("Supabase error object:", error);
        console.error("Error JSON:", JSON.stringify(error, null, 2));
        console.error("Error properties:", Object.keys(error));
        console.error("Full error details:", `Code: ${error.code}\nMessage: ${error.message}`);
        throw error;
      }

      showToast("Transaksi berhasil disimpan!", "success");
      router.refresh();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      
      // Handle rate limit errors
      let errorMessage = error?.message || "Gagal menyimpan transaksi. Silakan coba lagi.";
      
      if (error?.message?.toLowerCase().includes("rate limit") || 
          error?.message?.toLowerCase().includes("too many requests") ||
          error?.status === 429) {
        errorMessage = "Terlalu banyak request. Silakan tunggu beberapa saat dan coba lagi.";
      }
      
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setIsIncome(false);
    setSelectedCategory(null);
    setSelectedWallet(wallets.length > 0 ? wallets[0].id : "");
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] animate-in slide-in-from-bottom duration-300">
        <div
          className="mx-auto max-w-2xl rounded-t-3xl bg-slate-950/95 backdrop-blur-xl border-t border-x border-white/10 shadow-2xl"
          style={{
            boxShadow: '0 -20px 25px -5px rgba(0, 0, 0, 0.5), 0 -10px 10px -5px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Add Transaction</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <X className="text-slate-400" size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">
                  Rp
                </span>
                <input
                  type="text"
                  value={amount ? `Rp ${amount}` : "Rp 0"}
                  onChange={handleAmountChange}
                  placeholder="Rp 0"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold text-white bg-slate-900 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Income/Expense Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Transaction Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsIncome(false)}
                  disabled={isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all disabled:opacity-50 ${
                    !isIncome
                      ? "bg-red-500/20 border-red-500/50 text-red-400"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <ArrowDownCircle size={20} />
                  <span className="font-semibold">Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsIncome(true)}
                  disabled={isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all disabled:opacity-50 ${
                    isIncome
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <ArrowUpCircle size={20} />
                  <span className="font-semibold">Income</span>
                </button>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Category
              </label>
              {isLoadingCategories ? (
                <div className="w-full px-4 py-3 text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="w-full px-4 py-3 text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                  <p className="text-sm">Belum ada kategori. Silakan tambahkan kategori terlebih dahulu.</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {categories.map((category) => {
                    const categoryStyle = categoryStylesMap.get(category.id) || getCategoryStyle(category.name);
                    const Icon = categoryStyle.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        disabled={isLoading}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all disabled:opacity-50 ${
                          isSelected
                            ? `${categoryStyle.bgColor} border-cyan-500/50`
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                        title={category.name}
                      >
                        <Icon 
                          className={isSelected ? categoryStyle.iconColor : "text-slate-400"} 
                          size={24} 
                        />
                        <span className={`text-xs font-medium truncate w-full text-center ${isSelected ? "text-white" : "text-slate-400"}`}>
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wallet Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Wallet
              </label>
              <div className="relative">
                {isLoadingWallets ? (
                  <div className="w-full px-4 py-3 text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading wallets...</span>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedWallet}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                      disabled={isLoading || wallets.length === 0}
                      className="w-full px-4 py-3 text-white bg-slate-900 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
                      style={{ colorScheme: 'dark' }}
                    >
                      {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id} className="bg-slate-900 text-white">
                          {wallet.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Date
              </label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={20} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 text-white bg-slate-900/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              {/* Display formatted date */}
              <p className="mt-2 text-xs text-slate-500">
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Saving...</span>
                </>
              ) : (
                "Save Transaction"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
