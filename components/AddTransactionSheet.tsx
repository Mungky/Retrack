"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { revalidateTransactionPaths } from "@/app/actions";
import { X, ShoppingBag, Utensils, Car, Home, Heart, HeartPulse, Gamepad2, GraduationCap, Briefcase, Coffee, Plane, Loader2, Receipt, Zap, Banknote, Calendar, Laptop, TrendingUp, Gift, Building2, PiggyBank, Store, HandCoins, BadgeDollarSign, Coins } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { getTodayLocal } from "@/lib/date-range";
import CurrencyInput from "./CurrencyInput";
import { formThemes, getTransactionAccent } from "@/lib/form-themes";
import type { Category, Wallet } from "@/types";

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fixed type - no toggle, form is either Income or Expense */
  transactionType: "income" | "expense";
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
  // Income icons
  salary: Banknote,
  freelance: Laptop,
  investment: TrendingUp,
  bonus: BadgeDollarSign,
  gift: Gift,
  business: Store,
  rental: Building2,
  interest: PiggyBank,
  dividend: Coins,
  sidejob: HandCoins,
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
    // Income
    'salary': Banknote,
    'freelance': Laptop,
    'investment': TrendingUp,
    'bonus': BadgeDollarSign,
    'gift': Gift,
    'business': Store,
    'rental': Building2,
    'interest': PiggyBank,
    'dividend': Coins,
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
  // Income categories
  if (nameLower.includes('salary') || nameLower.includes('gaji')) {
    return Banknote;
  }
  if (nameLower.includes('freelance')) {
    return Laptop;
  }
  if (nameLower.includes('invest') || nameLower.includes('investasi') || nameLower.includes('saham')) {
    return TrendingUp;
  }
  if (nameLower.includes('bonus')) {
    return BadgeDollarSign;
  }
  if (nameLower.includes('gift') || nameLower.includes('hadiah')) {
    return Gift;
  }
  if (nameLower.includes('business') || nameLower.includes('bisnis') || nameLower.includes('usaha')) {
    return Store;
  }
  if (nameLower.includes('rental') || nameLower.includes('sewa') || nameLower.includes('kos')) {
    return Building2;
  }
  if (nameLower.includes('interest') || nameLower.includes('bunga') || nameLower.includes('tabungan')) {
    return PiggyBank;
  }
  if (nameLower.includes('dividend') || nameLower.includes('dividen')) {
    return Coins;
  }
  if (nameLower.includes('side') || nameLower.includes('sampingan') || nameLower.includes('komisi')) {
    return HandCoins;
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
    // Income categories
    'salary': {
      icon: Banknote,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    'freelance': {
      icon: Laptop,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10'
    },
    'investment': {
      icon: TrendingUp,
      iconColor: 'text-teal-500',
      bgColor: 'bg-teal-500/10'
    },
    'bonus': {
      icon: BadgeDollarSign,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    'gift': {
      icon: Gift,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-400/10'
    },
    'business': {
      icon: Store,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-600/10'
    },
    'rental': {
      icon: Building2,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-600/10'
    },
    'interest': {
      icon: PiggyBank,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    'dividend': {
      icon: Coins,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    'side job': {
      icon: HandCoins,
      iconColor: 'text-lime-500',
      bgColor: 'bg-lime-500/10'
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
  // Income categories
  if (nameLower.includes('salary') || nameLower.includes('gaji')) {
    return categoryMap['salary'];
  }
  if (nameLower.includes('freelance')) {
    return categoryMap['freelance'];
  }
  if (nameLower.includes('invest') || nameLower.includes('investasi') || nameLower.includes('saham')) {
    return categoryMap['investment'];
  }
  if (nameLower.includes('bonus')) {
    return categoryMap['bonus'];
  }
  if (nameLower.includes('gift') || nameLower.includes('hadiah')) {
    return categoryMap['gift'];
  }
  if (nameLower.includes('business') || nameLower.includes('bisnis') || nameLower.includes('usaha')) {
    return categoryMap['business'];
  }
  if (nameLower.includes('rental') || nameLower.includes('sewa') || nameLower.includes('kos')) {
    return categoryMap['rental'];
  }
  if (nameLower.includes('interest') || nameLower.includes('bunga') || nameLower.includes('tabungan')) {
    return categoryMap['interest'];
  }
  if (nameLower.includes('dividend') || nameLower.includes('dividen')) {
    return categoryMap['dividend'];
  }
  if (nameLower.includes('side') || nameLower.includes('sampingan') || nameLower.includes('komisi')) {
    return categoryMap['side job'];
  }

  // Default
  return {
    icon: Banknote,
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-500/10'
  };
};

export default function AddTransactionSheet({ isOpen, onClose, transactionType }: AddTransactionSheetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const isIncome = transactionType === "income";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Dynamic theme based on transaction type
  const accent = getTransactionAccent(transactionType);
  const theme = formThemes[accent];

  // Memoize category styles to prevent recalculation on every render
  const categoryStylesMap = useMemo(() => {
    const map = new Map<string, { icon: any; iconColor: string; bgColor: string }>();
    categories.forEach((category) => {
      map.set(category.id, getCategoryStyle(category.name));
    });
    return map;
  }, [categories]);

  // Filter categories by transaction type. Treat null/empty type as 'expense' (legacy fallback).
  const filteredCategories = useMemo(() => {
    const targetType = isIncome ? "income" : "expense";
    return categories.filter((cat) => {
      const effectiveType = (cat.type || "expense").toLowerCase();
      return effectiveType === targetType;
    });
  }, [categories, isIncome]);

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

  // Clear selected category when it's not in the filtered list
  useEffect(() => {
    if (selectedCategory && filteredCategories.length > 0) {
      const exists = filteredCategories.some((c) => c.id === selectedCategory);
      if (!exists) setSelectedCategory(null);
    }
  }, [filteredCategories, selectedCategory]);

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
      const [resPersonal, resGlobal] = await Promise.all([
        supabaseClient
          .from("categories")
          .select("id, name, icon, type")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        supabaseClient
          .from("categories")
          .select("id, name, icon, type")
          .is("user_id", null)
          .order("name", { ascending: true }),
      ]);

      const personal = resPersonal.error ? [] : (resPersonal.data || []);
      const global = resGlobal.error ? [] : (resGlobal.data || []);

      if (resPersonal.error) {
        console.warn("Categories (personal) fetch:", resPersonal.error.message);
      }
      if (resGlobal.error) {
        console.warn("Categories (global) fetch:", resGlobal.error.message);
      }

      const merged = [...global, ...personal].sort((a: Category, b: Category) =>
        a.name.localeCompare(b.name)
      );
      setCategories(merged);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      showToast("User tidak ditemukan. Silakan login terlebih dahulu.", "error");
      return;
    }

    if (amount <= 0) {
      showToast("Mohon masukkan nominal yang valid", "error");
      return;
    }

    if (!description?.trim()) {
      showToast("Mohon masukkan deskripsi", "error");
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

      const selectedWalletData = wallets.find(w => w.id === selectedWallet);
      
      if (!selectedWalletData) {
        throw new Error("Wallet tidak ditemukan");
      }

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

      const transactionData: any = {
        amount,
        type: isIncome ? "income" : "expense",
        date: selectedDate,
        description: description.trim(),
        category_id: categoryId,
        user_id: user.id,
        source_wallet_id: selectedWallet,
        destination_wallet_id: null,
      };

      const { data, error } = await supabaseClient
        .from("transactions")
        .insert([transactionData])
        .select();

      if (error) {
        console.error("Supabase error:", error.code, error.message);
        throw error;
      }

      await revalidateTransactionPaths();
      router.refresh();
      showToast("Transaksi berhasil disimpan!", "success");
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      
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
    setAmount(0);
    setDescription("");
    setSelectedCategory(null);
    setSelectedWallet(wallets.length > 0 ? wallets[0].id : "");
    setSelectedDate(getTodayLocal());
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] animate-in">
        <div className={`mx-auto max-w-2xl rounded-t-3xl rounded-b-none bg-slate-900/95 backdrop-blur-xl border-t border-x border-white/10 shadow-2xl ${theme.bgTint}`}>
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Header with accent dot */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <h2 className="text-xl font-bold text-white">
                {isIncome ? "Tambah Pemasukan" : "Tambah Pengeluaran"}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <X className="text-white/60" size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Amount - CurrencyInput */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Nominal
              </label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                accent={accent}
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Deskripsi
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Makan siang, Gaji bulanan"
                disabled={isLoading}
                className={`w-full px-4 py-3 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 transition-all placeholder:text-white/30 disabled:opacity-50 ${theme.inputFocus}`}
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Kategori
              </label>
              {isLoadingCategories ? (
                <div className="w-full px-4 py-3 text-white/60 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading categories...</span>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="w-full px-4 py-3 text-white/60 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className="text-sm">
                    {categories.length === 0
                      ? "Belum ada kategori. Silakan tambahkan kategori terlebih dahulu."
                      : `Belum ada kategori ${isIncome ? "pemasukan" : "pengeluaran"}. Tambahkan di halaman Categories.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {filteredCategories.map((category) => {
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
                            ? `${categoryStyle.bgColor} ${theme.selectedBorder}`
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                        title={category.name}
                      >
                        <Icon 
                          className={isSelected ? categoryStyle.iconColor : "text-slate-400"} 
                          size={24} 
                        />
                        <span className={`text-xs font-medium truncate w-full text-center ${isSelected ? "text-white" : "text-white/60"}`}>
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
                  <div className="w-full px-4 py-3 text-white/60 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading wallets...</span>
                  </div>
                ) : (
                  <select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    disabled={isLoading || wallets.length === 0}
                    className={`w-full px-4 py-3 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer disabled:opacity-50 ${theme.inputFocus}`}
                    style={{ colorScheme: 'dark' }}
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id} className="bg-slate-900 text-white">
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Tanggal
              </label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={20} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isLoading}
                  className={`w-full pl-12 pr-4 py-4 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${theme.inputFocus} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5`}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <p className="mt-2 text-xs text-white/40">
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Submit Button - themed */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl ${theme.submitGradient} text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              style={{ boxShadow: theme.submitShadow }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Menyimpan...</span>
                </>
              ) : (
                isIncome ? "Simpan Pemasukan" : "Simpan Pengeluaran"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
