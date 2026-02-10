"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CreditCard, Smartphone, Wallet as WalletIcon } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import type { Wallet, WalletType } from "@/types";

interface WalletFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
  onSuccess: (wallet: Wallet) => void;
}

const WALLET_TYPES = [
  { value: "bank", label: "Bank", icon: CreditCard },
  { value: "ewallet", label: "E-Wallet", icon: Smartphone },
  { value: "cash", label: "Cash", icon: WalletIcon },
];

export default function WalletFormSheet({
  isOpen,
  onClose,
  wallet,
  onSuccess,
}: WalletFormSheetProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { setIsSheetOpen } = useSheet();
  const [name, setName] = useState(wallet?.name || "");
  const [balance, setBalance] = useState(wallet?.balance?.toString() || "0");
  const [type, setType] = useState<WalletType>(wallet?.type || "bank");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (wallet) {
        setName(wallet.name);
        setBalance(wallet.balance.toString());
        setType(wallet.type);
      }
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, wallet, setIsSheetOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Nama wallet tidak boleh kosong.", "error");
      return;
    }

    if (!user?.id) {
      showToast("User tidak ditemukan.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const balanceNum = parseFloat(balance.replace(/\D/g, "")) || 0;

      const walletData = {
        name: name.trim(),
        balance: balanceNum,
        type,
        user_id: user.id,
      };

      let result;
      if (wallet) {
        const { data, error } = await supabaseClient
          .from("wallets")
          .update(walletData)
          .eq("id", wallet.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseClient
          .from("wallets")
          .insert([walletData])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      showToast(
        `Wallet berhasil ${wallet ? "diupdate" : "ditambahkan"}!`,
        "success"
      );
      onSuccess(result);
      onClose();
    } catch (error: any) {
      console.error("Error saving wallet:", error);
      showToast(error?.message || "Gagal menyimpan wallet.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-h-[90vh] bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {wallet ? "Edit Wallet" : "Tambah Wallet"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="text-slate-400" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nama Wallet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: BCA, Gopay, Cash"
              className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Tipe Wallet
            </label>
            <div className="grid grid-cols-3 gap-3">
              {WALLET_TYPES.map((walletType) => {
                const Icon = walletType.icon;
                const isSelected = type === walletType.value;
                return (
                  <button
                    key={walletType.value}
                    type="button"
                    onClick={() => setType(walletType.value as WalletType)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-500/50"
                        : "bg-slate-900/50 border-slate-800"
                    }`}
                  >
                    <Icon
                      className={`mx-auto mb-2 ${
                        isSelected ? "text-cyan-400" : "text-slate-400"
                      }`}
                      size={24}
                    />
                    <p
                      className={`text-xs font-semibold ${
                        isSelected ? "text-cyan-400" : "text-slate-400"
                      }`}
                    >
                      {walletType.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Saldo Awal
            </label>
            <input
              type="text"
              value={balance}
              onChange={(e) => setBalance(e.target.value.replace(/\D/g, ""))}
              placeholder="Rp 0"
              className="w-full px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white text-xl font-bold placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            {balance && (
              <p className="mt-2 text-sm text-slate-400">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(parseInt(balance.replace(/\D/g, "")) || 0)}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Memproses...</span>
              </>
            ) : (
              wallet ? "Update Wallet" : "Tambah Wallet"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
