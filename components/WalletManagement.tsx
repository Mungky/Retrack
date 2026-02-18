"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Pencil, Trash2, CreditCard, Smartphone, Wallet as WalletIcon, Plus } from "lucide-react";
import WalletFormSheet from "./WalletFormSheet";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Wallet } from "@/types";

interface WalletManagementProps {
  initialWallets: Wallet[];
  onWalletsChange?: (wallets: Wallet[]) => void;
}

const getWalletIcon = (type: string) => {
  switch (type) {
    case "bank":
      return CreditCard;
    case "ewallet":
      return Smartphone;
    case "cash":
      return WalletIcon;
    default:
      return WalletIcon;
  }
};

const getWalletConfig = (type: string) => {
  switch (type) {
    case "bank":
      return {
        gradient: "from-cyan-500/20 to-blue-500/20",
        border: "border-cyan-500/30",
        iconColor: "text-cyan-400",
      };
    case "ewallet":
      return {
        gradient: "from-emerald-500/20 to-green-500/20",
        border: "border-emerald-500/30",
        iconColor: "text-emerald-400",
      };
    case "cash":
      return {
        gradient: "from-amber-500/20 to-yellow-500/20",
        border: "border-amber-500/30",
        iconColor: "text-amber-400",
      };
    default:
      return {
        gradient: "from-white/10 to-white/5",
        border: "border-white/10",
        iconColor: "text-white/60",
      };
  }
};

function formatCurrencyCompact(amount: number): string {
  const absAmount = Math.abs(amount);
  const prefix = amount < 0 ? "-Rp " : "Rp ";
  if (absAmount >= 1_000_000_000) {
    const val = (absAmount / 1_000_000_000).toFixed(1).replace(".", ",");
    return `${prefix}${val} M`;
  }
  if (absAmount >= 1_000_000) {
    const val = (absAmount / 1_000_000).toFixed(1).replace(".", ",");
    return `${prefix}${val} Jt`;
  }
  if (absAmount >= 1_000) {
    const val = (absAmount / 1_000).toFixed(1).replace(".", ",");
    return `${prefix}${val} Rb`;
  }
  return `${prefix}${absAmount.toLocaleString("id-ID")}`;
}

export default function WalletManagement({ initialWallets, onWalletsChange }: WalletManagementProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const isLastWallet = menuOpenId
    ? wallets.findIndex((w) => w.id === menuOpenId) === wallets.length - 1
    : false;

  useEffect(() => {
    setWallets(initialWallets);
  }, [initialWallets]);

  useEffect(() => {
    if (menuOpenId && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      if (isLastWallet) {
        setMenuPosition({ top: rect.top - 8, left: rect.right - 130 });
      } else {
        setMenuPosition({ top: rect.bottom + 4, left: rect.right - 130 });
      }
    }
  }, [menuOpenId, isLastWallet]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async (walletId: string) => {
    if (!user?.id) return;

    try {
      const { data: transactions, error: checkError } = await supabaseClient
        .from("transactions")
        .select("id")
        .or(`source_wallet_id.eq.${walletId},destination_wallet_id.eq.${walletId}`)
        .eq("user_id", user.id)
        .limit(1);

      if (checkError) throw checkError;

      if (transactions && transactions.length > 0) {
        showToast(
          "Wallet ini memiliki transaksi. Tidak dapat dihapus.",
          "error"
        );
        return;
      }

      const { error } = await supabaseClient
        .from("wallets")
        .delete()
        .eq("id", walletId)
        .eq("user_id", user.id);

      if (error) throw error;

      const next = wallets.filter((w) => w.id !== walletId);
      setWallets(next);
      onWalletsChange?.(next);
      showToast("Wallet berhasil dihapus!", "success");
      setIsDeleteOpen(false);
    } catch (error: unknown) {
      console.error("Error deleting wallet:", error);
      showToast((error as { message?: string })?.message || "Gagal menghapus wallet.", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Row 1: My Accounts (rata kiri) | 2 Accounts (rata kanan) */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">My Accounts</h2>
        <p className="text-sm text-white/60">
          {wallets.length} Account{wallets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Add Wallet Button */}
      <button
        onClick={() => {
          setSelectedWallet(null);
          setIsFormOpen(true);
        }}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <Plus size={18} />
        Tambah Dompet
      </button>

      {/* Row 2: Wallet cards - rata kiri kanan (justify-between) */}
      {wallets.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-white/60">Belum ada wallet</p>
          <p className="text-white/40 text-sm mt-1">Tap &quot;Tambah Dompet&quot; di atas</p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-between gap-3">
          {wallets.map((wallet) => {
            const Icon = getWalletIcon(wallet.type);
            const config = getWalletConfig(wallet.type);

            return (
              <div
                key={wallet.id}
                className="glass-card p-5 hover:border-white/20 transition-all flex-1 min-w-[240px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${config.gradient} border ${config.border} ${config.iconColor}`}
                    >
                      <Icon size={24} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-0.5">
                        {wallet.name}
                      </h3>
                      <p className="text-xs text-white/60 capitalize font-medium">
                        {wallet.type === "ewallet" ? "E-Wallet" : wallet.type}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className="text-lg font-bold text-white mb-0.5 truncate max-w-[140px]"
                      title={formatCurrency(wallet.balance || 0)}
                    >
                      {formatCurrencyCompact(wallet.balance || 0)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-white/60 font-medium">Active</span>
                    </div>
                  </div>

                  <div className="relative flex-shrink-0 ml-4">
                    <button
                      ref={menuOpenId === wallet.id ? menuButtonRef : undefined}
                      onClick={() =>
                        setMenuOpenId(menuOpenId === wallet.id ? null : wallet.id)
                      }
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Menu"
                    >
                      <MoreVertical className="text-white/50" size={20} />
                    </button>

                    {menuOpenId === wallet.id &&
                      typeof document !== "undefined" &&
                      createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-[80]"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div
                            className="fixed z-[90] fintech-card py-1 min-w-[130px] animate-fade-in"
                            style={{
                              top: menuPosition.top,
                              left: menuPosition.left,
                              transform: isLastWallet ? "translateY(-100%)" : "none",
                            }}
                          >
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                setSelectedWallet(wallet);
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
                                setSelectedWallet(wallet);
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      <WalletFormSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedWallet(null);
        }}
        wallet={selectedWallet}
        onSuccess={(newWallet) => {
          const next = selectedWallet
            ? wallets.map((w) => (w.id === selectedWallet.id ? newWallet : w))
            : [...wallets, newWallet];
          setWallets(next);
          onWalletsChange?.(next);
          setIsFormOpen(false);
          setSelectedWallet(null);
        }}
      />

      {selectedWallet && (
        <DeleteConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedWallet(null);
          }}
          transactionId={selectedWallet.id}
          onConfirm={() => handleDelete(selectedWallet.id)}
        />
      )}
    </div>
  );
}
