"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CreditCard, Smartphone, Wallet as WalletIcon } from "lucide-react";
import WalletFormSheet from "./WalletFormSheet";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Wallet } from "@/types";

interface WalletManagementProps {
  initialWallets: Wallet[];
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
        gradient: "from-blue-500/20 via-cyan-500/10 to-blue-600/20",
        border: "border-blue-500/30",
        iconColor: "text-blue-400",
      };
    case "ewallet":
      return {
        gradient: "from-emerald-500/20 via-green-500/10 to-emerald-600/20",
        border: "border-emerald-500/30",
        iconColor: "text-emerald-400",
      };
    case "cash":
      return {
        gradient: "from-amber-500/20 via-yellow-500/10 to-amber-600/20",
        border: "border-amber-500/30",
        iconColor: "text-amber-400",
      };
    default:
      return {
        gradient: "from-slate-500/20 via-gray-500/10 to-slate-600/20",
        border: "border-slate-500/30",
        iconColor: "text-slate-400",
      };
  }
};

export default function WalletManagement({ initialWallets }: WalletManagementProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    setWallets(initialWallets);
  }, [initialWallets]);

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
      // Check if wallet has transactions
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

      setWallets(wallets.filter((w) => w.id !== walletId));
      showToast("Wallet berhasil dihapus!", "success");
      setIsDeleteOpen(false);
    } catch (error: any) {
      console.error("Error deleting wallet:", error);
      showToast(error?.message || "Gagal menghapus wallet.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My Accounts</h2>
          <p className="text-sm text-slate-400">{wallets.length} Account{wallets.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            setSelectedWallet(null);
            setIsFormOpen(true);
          }}
          className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg"
          style={{
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
          }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Wallets List */}
      {wallets.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-12 text-center">
          <p className="text-slate-400">Belum ada wallet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet) => {
            const Icon = getWalletIcon(wallet.type);
            const config = getWalletConfig(wallet.type);

            return (
              <div
                key={wallet.id}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 border border-slate-800 p-5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${config.gradient} border ${config.border} ${config.iconColor}`}>
                      <Icon size={24} />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-0.5">
                        {wallet.name}
                      </h3>
                      <p className="text-xs text-slate-400 capitalize font-medium">
                        {wallet.type === "ewallet" ? "E-Wallet" : wallet.type}
                      </p>
                    </div>
                  </div>

                  {/* Right: Balance */}
                  <div className="text-right">
                    <p className="text-xl font-bold text-white mb-0.5">
                      {formatCurrency(wallet.balance)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      <span className="text-xs text-slate-400 font-medium">Active</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <button
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setIsFormOpen(true);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="text-cyan-400" size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setIsDeleteOpen(true);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="text-red-400" size={16} />
                    </button>
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
          if (selectedWallet) {
            setWallets(
              wallets.map((w) =>
                w.id === selectedWallet.id ? newWallet : w
              )
            );
          } else {
            setWallets([...wallets, newWallet]);
          }
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
