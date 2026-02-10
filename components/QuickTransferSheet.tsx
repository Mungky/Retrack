"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRightLeft, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import type { Wallet } from "@/types";

interface QuickTransferSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickTransferSheet({ isOpen, onClose }: QuickTransferSheetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [amount, setAmount] = useState("");
  const [fromWallet, setFromWallet] = useState<string>("");
  const [toWallet, setToWallet] = useState<string>("");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (user?.id) {
        fetchWallets();
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

  // Reset toWallet if it becomes the same as fromWallet
  useEffect(() => {
    if (fromWallet && toWallet === fromWallet) {
      setToWallet("");
    }
  }, [fromWallet, toWallet]);

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
        if (!fromWallet) {
          setFromWallet(data[0].id);
        }
      } else {
        showToast("Belum ada wallet. Silakan tambahkan wallet terlebih dahulu.", "error");
      }
    } catch (error: any) {
      console.error("Error fetching wallets:", error);
      showToast("Gagal memuat data wallet. Silakan coba lagi.", "error");
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setFromWallet(wallets[0]?.id || "");
    setToWallet("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !fromWallet || !toWallet) {
      showToast("Mohon lengkapi semua field.", "error");
      return;
    }

    if (fromWallet === toWallet) {
      showToast("Wallet sumber dan tujuan harus berbeda.", "error");
      return;
    }

    const amountNum = parseInt(amount.replace(/\D/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Nominal tidak valid.", "error");
      return;
    }

    const fromWalletData = wallets.find((w) => w.id === fromWallet);
    if (!fromWalletData || fromWalletData.balance < amountNum) {
      showToast("Saldo tidak mencukupi.", "error");
      return;
    }

    if (!user?.id) {
      showToast("User tidak ditemukan. Silakan login terlebih dahulu.", "error");
      return;
    }

    setIsLoading(true);

    let insertedTransactionId: string | null = null;
    let sourceWalletUpdated = false;

    try {
      // Create transfer transaction
      const transactionData = {
        amount: amountNum,
        type: "transfer",
        date: new Date().toISOString().split("T")[0],
        source_wallet_id: fromWallet,
        destination_wallet_id: toWallet,
        user_id: user.id,
      };

      const { data: insertedTransaction, error: transactionError } = await supabaseClient
        .from("transactions")
        .insert([transactionData])
        .select("id")
        .single();

      if (transactionError) throw transactionError;
      insertedTransactionId = insertedTransaction?.id || null;

      // Update wallet balances
      const fromNewBalance = fromWalletData.balance - amountNum;
      const toWalletData = wallets.find((w) => w.id === toWallet);
      const toNewBalance = (toWalletData?.balance || 0) + amountNum;

      const { error: fromUpdateError } = await supabaseClient
        .from("wallets")
        .update({ balance: fromNewBalance })
        .eq("id", fromWallet)
        .eq("user_id", user.id);

      if (fromUpdateError) {
        throw fromUpdateError;
      }

      sourceWalletUpdated = true;

      const { error: toUpdateError } = await supabaseClient
        .from("wallets")
        .update({ balance: toNewBalance })
        .eq("id", toWallet)
        .eq("user_id", user.id);

      if (toUpdateError) {
        throw toUpdateError;
      }

      showToast("Transfer berhasil!", "success");
      onClose();
      resetForm();
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error: any) {
      if (user?.id) {
        if (sourceWalletUpdated && fromWalletData) {
          const { error: rollbackSourceError } = await supabaseClient
            .from("wallets")
            .update({ balance: fromWalletData.balance })
            .eq("id", fromWallet)
            .eq("user_id", user.id);

          if (rollbackSourceError) {
            console.error("Rollback source wallet failed:", rollbackSourceError);
          }
        }

        if (insertedTransactionId) {
          const { error: rollbackTransactionError } = await supabaseClient
            .from("transactions")
            .delete()
            .eq("id", insertedTransactionId)
            .eq("user_id", user.id);

          if (rollbackTransactionError) {
            console.error("Rollback transaction delete failed:", rollbackTransactionError);
          }
        }
      }

      console.error("Error transferring:", error);
      showToast(
        error?.message || "Gagal melakukan transfer. Silakan coba lagi.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableToWallets = wallets.filter((w) => w.id !== fromWallet);

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-h-[90vh] bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <ArrowRightLeft className="text-cyan-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Quick Transfer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="text-slate-400" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nominal
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setAmount(value);
              }}
              placeholder="Rp 0"
              className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white text-2xl font-bold placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            {amount && (
              <p className="mt-2 text-sm text-slate-400">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(parseInt(amount.replace(/\D/g, "")) || 0)}
              </p>
            )}
          </div>

          {/* From Wallet */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Dari Wallet
            </label>
            {isLoadingWallets ? (
              <div className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center">
                <Loader2 className="animate-spin text-cyan-400" size={20} />
              </div>
            ) : (
              <select
                value={fromWallet}
                onChange={(e) => {
                  setFromWallet(e.target.value);
                  if (toWallet === e.target.value) {
                    setToWallet("");
                  }
                }}
                className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} - {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(wallet.balance)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* To Wallet */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Ke Wallet
            </label>
            <select
              value={toWallet}
              onChange={(e) => setToWallet(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              disabled={!fromWallet || availableToWallets.length === 0}
            >
              <option value="">Pilih wallet tujuan</option>
              {availableToWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name} - {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(wallet.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLoadingWallets}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Memproses...</span>
              </>
            ) : (
              "Transfer Sekarang"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
