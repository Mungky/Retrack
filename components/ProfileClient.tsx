"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  LogOut,
  Loader2,
  ChevronRight,
  Wallet as WalletIcon,
  FolderTree,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import WalletManagement from "./WalletManagement";
import CategoryManager from "./CategoryManager";
import type { Wallet, Category } from "@/types";

const APP_VERSION = "v1.0.0 (Beta)";

interface ProfileClientProps {
  initialWallets: Wallet[];
  initialCategories: Category[];
}

export default function ProfileClient({
  initialWallets,
  initialCategories,
}: ProfileClientProps) {
  const { user, loading, signOut } = useAuth();
  const { showToast } = useToast();
  const [walletsSheetOpen, setWalletsSheetOpen] = useState(false);
  const [categoriesSheetOpen, setCategoriesSheetOpen] = useState(false);
  const [walletsPortalMounted, setWalletsPortalMounted] = useState(false);
  const [categoriesPortalMounted, setCategoriesPortalMounted] = useState(false);
  const [wallets, setWallets] = useState(initialWallets);
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    setWallets(initialWallets);
  }, [initialWallets]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleLogout = async () => {
    try {
      await signOut();
      showToast("Logged out successfully!", "success");
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = "/login";
    } catch (error: unknown) {
      console.error("Logout error:", error);
      showToast("Failed to logout. Please try again.", "error");
    }
  };

  const handleExportData = () => {
    showToast("Export Data feature coming soon!", "success");
  };

  if (loading) {
    return (
      <main className="min-h-screen pb-32 px-4 py-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen pb-32 px-4 py-8">
        <div className="glass-card p-12 text-center">
          <p className="text-white/60">User not found</p>
        </div>
      </main>
    );
  }

  const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "User";
  const accountStatus: "Free" | "Pro" = "Free"; // TODO: integrate with premium/subscription

  const menuItems = [
    {
      label: "Manage Wallets",
      subtitle: "Add / Edit Wallets",
      icon: WalletIcon,
      onClick: () => {
        setWalletsSheetOpen(true);
        setWalletsPortalMounted(true);
      },
    },
    {
      label: "Manage Categories",
      subtitle: "Customize Categories",
      icon: FolderTree,
      onClick: () => {
        setCategoriesSheetOpen(true);
        setCategoriesPortalMounted(true);
      },
    },
    {
      label: "Export Data",
      subtitle: "Coming soon",
      icon: Download,
      onClick: handleExportData,
    },
  ];

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10 flex flex-col">
      {/* Header: User Card */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Control Center</h1>
        <p className="text-white/60 text-sm mb-6">Manage your account and settings</p>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <User className="text-white" size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {displayName}
              </h2>
              <p className="text-white/60 text-sm truncate">{user.email}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  (accountStatus as string) === "Pro"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-700/50 text-slate-400 border border-slate-600"
                }`}
              >
                {accountStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Mail className="text-cyan-400 flex-shrink-0" size={20} />
            <p className="text-white font-medium truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Settings - List Style */}
      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Settings
        </h3>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full glass-card p-4 flex items-center gap-4 hover:border-white/20 transition-all text-left group"
            >
              <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                <Icon className="text-cyan-400" size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-sm text-white/50 truncate">{item.subtitle}</p>
              </div>
              <ChevronRight className="text-white/40 flex-shrink-0" size={20} />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl glass-card border-rose-500/30 text-rose-400 font-bold text-lg hover:border-rose-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* App Version Footer */}
      <p className="text-center text-xs text-white/30 mt-8 mb-4">
        App Version: {APP_VERSION}
      </p>

      {/* Sheets */}
      {walletsPortalMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <WalletManagementSheet
            isOpen={walletsSheetOpen}
            initialWallets={wallets}
            onClose={() => setWalletsSheetOpen(false)}
            onWalletsChange={setWallets}
            onExitComplete={() => setWalletsPortalMounted(false)}
          />,
          document.body
        )}

      {categoriesPortalMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <CategoryManagerSheet
            isOpen={categoriesSheetOpen}
            initialCategories={categories}
            onClose={() => setCategoriesSheetOpen(false)}
            onCategoriesChange={setCategories}
            onExitComplete={() => setCategoriesPortalMounted(false)}
          />,
          document.body
        )}
    </main>
  );
}

const sheetTransition = { type: "spring" as const, damping: 28, stiffness: 280 };

function WalletManagementSheet({
  isOpen,
  initialWallets,
  onClose,
  onWalletsChange,
  onExitComplete,
}: {
  isOpen: boolean;
  initialWallets: Wallet[];
  onClose: () => void;
  onWalletsChange?: (wallets: Wallet[]) => void;
  onExitComplete: () => void;
}) {
  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {isOpen && (
        <motion.div
          key="wallets-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={sheetTransition}
            className="absolute inset-x-0 bottom-0 top-1/4 rounded-t-3xl bg-[#181A25] border-t border-x border-white/10 overflow-hidden flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="px-4 pb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Manage Wallets</h2>
              <p className="text-sm text-white/50">Add or edit your wallets</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <WalletManagement
                initialWallets={initialWallets}
                onWalletsChange={onWalletsChange}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CategoryManagerSheet({
  isOpen,
  initialCategories,
  onClose,
  onCategoriesChange,
  onExitComplete,
}: {
  isOpen: boolean;
  initialCategories: Category[];
  onClose: () => void;
  onCategoriesChange?: (categories: Category[]) => void;
  onExitComplete: () => void;
}) {
  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {isOpen && (
        <motion.div
          key="categories-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={sheetTransition}
            className="absolute inset-x-0 bottom-0 top-[10%] rounded-t-3xl bg-[#181A25] border-t border-x border-white/10 overflow-hidden flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="px-4 pb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Manage Categories</h2>
              <p className="text-sm text-white/50">Customize your transaction categories</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CategoryManager
                initialCategories={initialCategories}
                onCategoriesChange={onCategoriesChange}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
