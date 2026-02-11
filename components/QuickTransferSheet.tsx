"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { revalidateTransactionPaths } from "@/app/actions";
import { X, ArrowRightLeft, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import { getTodayLocal } from "@/lib/date-range";
import CurrencyInput from "./CurrencyInput";
import { formThemes } from "@/lib/form-themes";
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
  const [amount, setAmount] = useState(0);
  const [fromWallet, setFromWallet] = useState<string>("");
  const [toWallet, setToWallet] = useState<string>("");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);

  // Blue/indigo theme for transfers
  const theme = formThemes.blue;

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
    setAmount(0);
    setFromWallet(wallets[0]?.id || "");
    setToWallet("");
  };

  const formatWalletBalance = (bal: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(bal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromWallet || !toWallet) {
      showToast("Mohon lengkapi semua field.", "error");
      return;
    }

    if (fromWallet === toWallet) {
      showToast("Wallet sumber dan tujuan harus berbeda.", "error");
      return;
    }

    if (amount <= 0) {
      showToast("Nominal tidak valid.", "error");
      return;
    }

    const fromWalletData = wallets.find((w) => w.id === fromWallet);
    if (!fromWalletData || fromWalletData.balance < amount) {
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
      const transactionData = {
        amount,
        type: "transfer",
        date: getTodayLocal(),
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

      const fromNewBalance = fromWalletData.balance - amount;
      const toWalletData = wallets.find((w) => w.id === toWallet);
      const toNewBalance = (toWalletData?.balance || 0) + amount;

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

      await revalidateTransactionPaths();
      showToast("Transfer berhasil!", "success");
      onClose();
      resetForm();
      setTimeout(() => router.refresh(), 500);
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

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/80 z-[60] transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[60] animate-in">
        <div
          className="mx-auto max-w-2xl rounded-t-3xl rounded-b-none bg-[#181A25] border-t border-x border-white/10 shadow-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <h2 className="text-xl font-bold text-white">Quick Transfer</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="text-white/60" size={20} />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6 overflow-y-auto"
            style={{
              maxHeight: "calc(90vh - 140px)",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
          {/* Amount - CurrencyInput */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Nominal
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              accent="blue"
            />
          </div>

          {/* From Wallet */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Dari Wallet
            </label>
            {isLoadingWallets ? (
              <div className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                <Loader2 className="animate-spin text-blue-400" size={20} />
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
                className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 transition-all ${theme.inputFocus}`}
                style={{ colorScheme: 'dark' }}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id} className="bg-slate-900">
                    {wallet.name} - {formatWalletBalance(wallet.balance)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <ArrowRightLeft className="text-blue-400" size={16} />
            </div>
          </div>

          {/* To Wallet */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Ke Wallet
            </label>
            <select
              value={toWallet}
              onChange={(e) => setToWallet(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.inputFocus}`}
              style={{ colorScheme: 'dark' }}
              disabled={!fromWallet || availableToWallets.length === 0}
            >
              <option value="" className="bg-slate-900">Pilih wallet tujuan</option>
              {availableToWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id} className="bg-slate-900">
                  {wallet.name} - {formatWalletBalance(wallet.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button - blue themed */}
          <button
            type="submit"
            disabled={isLoading || isLoadingWallets}
            className={`w-full py-4 rounded-2xl ${theme.submitGradient} text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            style={{ boxShadow: theme.submitShadow }}
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
    </>,
    document.body
  );
}
