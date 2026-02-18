"use client";

import { useState, useEffect } from "react";
import { Loader2, CreditCard, Smartphone, Wallet as WalletIcon } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSheet } from "@/contexts/SheetContext";
import CurrencyInput from "./CurrencyInput";
import { formThemes } from "@/lib/form-themes";
import { BaseSheet } from "@/components/shared/BaseSheet";
import { Button, Input } from "@/components/ui";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
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
  const [initialBalance, setInitialBalance] = useState(
    wallet ? (wallet.initial_balance ?? wallet.balance) : 0
  );
  const [type, setType] = useState<WalletType>(wallet?.type || "bank");
  const [isLoading, setIsLoading] = useState(false);

  // Violet theme for wallet forms
  const theme = formThemes.violet;

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
      if (wallet) {
        setName(wallet.name);
        setInitialBalance(wallet.initial_balance ?? wallet.balance);
        setType(wallet.type);
      } else {
        setName("");
        setInitialBalance(0);
        setType("bank");
      }
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, wallet, setIsSheetOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast(TOAST_MESSAGES.ERROR.VALIDATE_WALLET_NAME, "error");
      return;
    }

    if (!user?.id) {
      showToast(TOAST_MESSAGES.ERROR.USER_NOT_FOUND, "error");
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (wallet) {
        const { data, error } = await supabaseClient
          .from("wallets")
          .update({
            name: name.trim(),
            initial_balance: initialBalance,
            type,
            user_id: user.id,
          })
          .eq("id", wallet.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseClient
          .from("wallets")
          .insert([
            {
              name: name.trim(),
              initial_balance: initialBalance,
              balance: initialBalance,
              type,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      showToast(
        wallet ? TOAST_MESSAGES.SUCCESS.WALLET_UPDATED : TOAST_MESSAGES.SUCCESS.WALLET_ADDED,
        "success"
      );
      onSuccess(result);
      onClose();
    } catch (error: any) {
      console.error("Error saving wallet:", error);
      showToast(error?.message || TOAST_MESSAGES.ERROR.WALLET_SAVE_FAILED, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseSheet
      isOpen={isOpen}
      onClose={onClose}
      title={wallet ? "Edit Wallet" : "Tambah Wallet"}
      titleAccent={<div className="w-2 h-2 rounded-full bg-primary" />}
      nested
      disabled={isLoading}
    >
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
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: BCA, Gopay, Cash"
              className="rounded-2xl"
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
                        ? "bg-primary/20 border-primary/50"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <Icon
                      className={`mx-auto mb-2 ${
                        isSelected ? "text-primary" : "text-slate-400"
                      }`}
                      size={24}
                    />
                    <p
                      className={`text-xs font-semibold text-center ${
                        isSelected ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      {walletType.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balance - CurrencyInput */}
          <div>
            <label
              className={`block text-sm mb-2 ${
                wallet
                  ? "text-amber-400 font-medium"
                  : "text-slate-400 font-medium"
              }`}
            >
              {wallet ? "⚠ Koreksi Saldo Awal (Recalculate)" : "Saldo Awal"}
            </label>
            <CurrencyInput
              value={initialBalance}
              onChange={setInitialBalance}
              accent="violet"
            />
            {wallet && (
              <p className="text-xs text-white/50 mt-1">
                Mengubah saldo awal akan memicu perhitungan ulang. Saldo saat ini = saldo awal + transaksi.
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Memproses...</span>
              </>
            ) : (
              wallet ? "Update Wallet" : "Tambah Wallet"
            )}
          </Button>
        </form>
    </BaseSheet>
  );
}
