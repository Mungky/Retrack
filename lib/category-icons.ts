/**
 * Category icon utilities - Lucide icon mapping and helpers.
 */
import {
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
  Zap,
  HeartPulse,
  Laptop,
  TrendingUp,
  Gift,
  Building2,
  PiggyBank,
  Store,
  HandCoins,
  Coins,
  Banknote,
} from "lucide-react";

export const ICON_MAP: { [key: string]: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> } = {
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
  salary: Briefcase,
  freelance: Laptop,
  investment: TrendingUp,
  bonus: Gift,
  gift: Gift,
  business: Store,
  rental: Building2,
  interest: PiggyBank,
  dividend: Coins,
  sidejob: HandCoins,
};

const getIconByName = (categoryName: string) => {
  if (!categoryName) return Receipt;
  const nameLower = categoryName.toLowerCase().trim();
  const exactMatchMap: { [key: string]: typeof Receipt } = {
    food: Utensils,
    shopping: ShoppingBag,
    transport: Car,
    bills: Home,
    health: Heart,
    entertainment: Gamepad2,
    education: GraduationCap,
    work: Briefcase,
    coffee: Coffee,
    travel: Plane,
    salary: Briefcase,
    freelance: Laptop,
    investment: TrendingUp,
    bonus: Gift,
    gift: Gift,
    business: Store,
    rental: Building2,
    interest: PiggyBank,
    dividend: Coins,
  };
  if (exactMatchMap[nameLower]) return exactMatchMap[nameLower];
  if (nameLower.includes("food") || nameLower.includes("makanan") || nameLower.includes("restaurant")) return Utensils;
  if (nameLower.includes("shopping") || nameLower.includes("belanja")) return ShoppingBag;
  if (nameLower.includes("transport") || nameLower.includes("transportasi") || nameLower.includes("car")) return Car;
  if (nameLower.includes("bills") || nameLower.includes("tagihan") || nameLower.includes("utilities")) return Home;
  if (nameLower.includes("health") || nameLower.includes("kesehatan") || nameLower.includes("medical")) return Heart;
  if (nameLower.includes("entertainment") || nameLower.includes("hiburan") || nameLower.includes("game")) return Gamepad2;
  if (nameLower.includes("education") || nameLower.includes("pendidikan") || nameLower.includes("school")) return GraduationCap;
  if (nameLower.includes("work") || nameLower.includes("kerja") || nameLower.includes("business")) return Briefcase;
  if (nameLower.includes("coffee") || nameLower.includes("kopi") || nameLower.includes("cafe")) return Coffee;
  if (nameLower.includes("travel") || nameLower.includes("perjalanan") || nameLower.includes("trip")) return Plane;
  if (nameLower.includes("salary") || nameLower.includes("gaji")) return Briefcase;
  if (nameLower.includes("freelance")) return Laptop;
  if (nameLower.includes("invest") || nameLower.includes("investasi") || nameLower.includes("saham")) return TrendingUp;
  if (nameLower.includes("bonus")) return Gift;
  if (nameLower.includes("gift") || nameLower.includes("hadiah")) return Gift;
  if (nameLower.includes("business") || nameLower.includes("bisnis") || nameLower.includes("usaha")) return Store;
  if (nameLower.includes("rental") || nameLower.includes("sewa") || nameLower.includes("kos")) return Building2;
  if (nameLower.includes("interest") || nameLower.includes("bunga") || nameLower.includes("tabungan")) return PiggyBank;
  if (nameLower.includes("dividend") || nameLower.includes("dividen")) return Coins;
  if (nameLower.includes("side") || nameLower.includes("sampingan") || nameLower.includes("komisi")) return HandCoins;
  return Receipt;
};

export const getCategoryIcon = (iconName: string | null, categoryName?: string) => {
  if (iconName) {
    const iconKey = iconName.toLowerCase().trim();
    const icon = ICON_MAP[iconKey];
    if (icon) return icon;
  }
  if (categoryName) return getIconByName(categoryName);
  return Receipt;
};

export const isEmojiIcon = (icon: string | null) =>
  icon != null && icon.length <= 4 && !/^[a-z0-9_-]+$/i.test(icon.trim());

const categoryStyleMap: { [key: string]: { icon: typeof Receipt; iconColor: string; bgColor: string } } = {
  food: { icon: Utensils, iconColor: "text-orange-500", bgColor: "bg-orange-500/10" },
  shopping: { icon: ShoppingBag, iconColor: "text-pink-500", bgColor: "bg-pink-500/10" },
  transport: { icon: Car, iconColor: "text-blue-500", bgColor: "bg-blue-500/10" },
  bills: { icon: Zap, iconColor: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  health: { icon: HeartPulse, iconColor: "text-red-500", bgColor: "bg-red-500/10" },
  entertainment: { icon: Gamepad2, iconColor: "text-purple-500", bgColor: "bg-purple-500/10" },
  education: { icon: GraduationCap, iconColor: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  work: { icon: Briefcase, iconColor: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  coffee: { icon: Coffee, iconColor: "text-amber-600", bgColor: "bg-amber-600/10" },
  travel: { icon: Plane, iconColor: "text-sky-500", bgColor: "bg-sky-500/10" },
  salary: { icon: Briefcase, iconColor: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  freelance: { icon: Laptop, iconColor: "text-violet-500", bgColor: "bg-violet-500/10" },
  investment: { icon: TrendingUp, iconColor: "text-teal-500", bgColor: "bg-teal-500/10" },
  bonus: { icon: Gift, iconColor: "text-amber-500", bgColor: "bg-amber-500/10" },
  gift: { icon: Gift, iconColor: "text-rose-400", bgColor: "bg-rose-400/10" },
  business: { icon: Store, iconColor: "text-cyan-600", bgColor: "bg-cyan-600/10" },
  rental: { icon: Building2, iconColor: "text-blue-600", bgColor: "bg-blue-600/10" },
  interest: { icon: PiggyBank, iconColor: "text-green-500", bgColor: "bg-green-500/10" },
  dividend: { icon: Coins, iconColor: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  "side job": { icon: HandCoins, iconColor: "text-lime-500", bgColor: "bg-lime-500/10" },
};

export const getCategoryStyle = (categoryName: string | null | undefined) => {
  if (!categoryName)
    return { icon: Receipt, iconColor: "text-slate-400", bgColor: "bg-slate-500/10" };
  const nameLower = categoryName.toLowerCase().trim();
  if (categoryStyleMap[nameLower]) return categoryStyleMap[nameLower];
  if (nameLower.includes("food") || nameLower.includes("makanan") || nameLower.includes("restaurant")) return categoryStyleMap.food;
  if (nameLower.includes("shopping") || nameLower.includes("belanja")) return categoryStyleMap.shopping;
  if (nameLower.includes("transport") || nameLower.includes("transportasi") || nameLower.includes("car")) return categoryStyleMap.transport;
  if (nameLower.includes("bills") || nameLower.includes("tagihan") || nameLower.includes("utilities")) return categoryStyleMap.bills;
  if (nameLower.includes("health") || nameLower.includes("kesehatan") || nameLower.includes("medical")) return categoryStyleMap.health;
  if (nameLower.includes("entertainment") || nameLower.includes("hiburan") || nameLower.includes("game")) return categoryStyleMap.entertainment;
  if (nameLower.includes("education") || nameLower.includes("pendidikan") || nameLower.includes("school")) return categoryStyleMap.education;
  if (nameLower.includes("work") || nameLower.includes("kerja") || nameLower.includes("business")) return categoryStyleMap.work;
  if (nameLower.includes("coffee") || nameLower.includes("kopi") || nameLower.includes("cafe")) return categoryStyleMap.coffee;
  if (nameLower.includes("travel") || nameLower.includes("perjalanan") || nameLower.includes("trip")) return categoryStyleMap.travel;
  if (nameLower.includes("salary") || nameLower.includes("gaji")) return categoryStyleMap.salary;
  if (nameLower.includes("freelance")) return categoryStyleMap.freelance;
  if (nameLower.includes("invest") || nameLower.includes("investasi") || nameLower.includes("saham")) return categoryStyleMap.investment;
  if (nameLower.includes("bonus")) return categoryStyleMap.bonus;
  if (nameLower.includes("gift") || nameLower.includes("hadiah")) return categoryStyleMap.gift;
  if (nameLower.includes("business") || nameLower.includes("bisnis") || nameLower.includes("usaha")) return categoryStyleMap.business;
  if (nameLower.includes("rental") || nameLower.includes("sewa") || nameLower.includes("kos")) return categoryStyleMap.rental;
  if (nameLower.includes("interest") || nameLower.includes("bunga") || nameLower.includes("tabungan")) return categoryStyleMap.interest;
  if (nameLower.includes("dividend") || nameLower.includes("dividen")) return categoryStyleMap.dividend;
  if (nameLower.includes("side") || nameLower.includes("sampingan") || nameLower.includes("komisi")) return categoryStyleMap["side job"];
  return { icon: Banknote, iconColor: "text-slate-500", bgColor: "bg-slate-500/10" };
};
