"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CreditCard, Smartphone, Wallet as WalletIcon } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import CurrencyInput from "./CurrencyInput";
import { formThemes } from "@/lib/form-themes";
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
  const [balance, setBalance] = useState(wallet?.balance || 0);
  const [type, setType] = useState<WalletType>(wallet?.type || "bank");
  const [isLoading, setIsLoading] = useState(false);

  // Violet theme for wallet forms
  const theme = formThemes.violet;

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (wallet) {
        // Editing – populate fields
        setName(wallet.name);
        setBalance(wallet.balance);
        setType(wallet.type);
      } else {
        // Adding new – reset to defaults
        setName("");
        setBalance(0);
        setType("bank");
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
      const walletData = {
        name: name.trim(),
        balance,
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
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <h2 className="text-xl font-bold text-white">
                {wallet ? "Edit Wallet" : "Tambah Wallet"}
              </h2>
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Nama Wallet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: BCA, Gopay, Cash"
              className={`w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all ${theme.inputFocus}`}
            />
          </div>

          {/* Wallet Type - visual cards */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
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
                        ? "bg-violet-500/20 border-violet-500/50"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <Icon
                      className={`mx-auto mb-2 ${
                        isSelected ? "text-violet-400" : "text-slate-400"
                      }`}
                      size={24}
                    />
                    <p
                      className={`text-xs font-semibold text-center ${
                        isSelected ? "text-violet-400" : "text-slate-400"
                      }`}
                    >
                      {walletType.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Balance - CurrencyInput */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Saldo Awal
            </label>
            <CurrencyInput
              value={balance}
              onChange={setBalance}
              accent="violet"
            />
          </div>

          {/* Submit - violet themed */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl ${theme.submitGradient} text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            style={{ boxShadow: theme.submitShadow }}
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
    </>,
    document.body
  );
}
