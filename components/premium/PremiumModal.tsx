"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { usePremiumModalStore } from "@/stores/premiumModalStore";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import { LIFETIME_PREMIUM_AMOUNT, LIFETIME_PREMIUM_LABEL } from "@/lib/constants";
import { upgradeToProLifetime } from "@/app/actions/subscription";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

const BENEFITS = [
  { icon: "🎨", text: "Unlock Sultan & Forest Themes" },
  { icon: "📂", text: "Custom Categories (Add/Edit)" },
  { icon: "📊", text: "Full Analytics (Trend & Cashflow)" },
  { icon: "📥", text: "Export Data to CSV" },
  { icon: "📈", text: "Unlimited Budgets" },
] as const;


export function PremiumModal() {
  const { isOpen, close } = usePremiumModalStore();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { setTheme } = useTheme();
  const upgrade = useSubscriptionStore((s) => s.upgrade);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [snapReady, setSnapReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.snap) {
      setSnapReady(true);
    }
  }, []);

  const handleUnlock = async () => {
    if (!user?.id || !clientKey?.trim()) return;
    try {
      setIsUpgrading(true);

      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gross_amount: LIFETIME_PREMIUM_AMOUNT,
          customer_details: {
            first_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Customer",
            email: user.email || "customer@example.com",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat transaksi");
      }

      const { token, order_id: orderId } = data;
      if (!token) {
        throw new Error("Token pembayaran tidak diterima");
      }
      if (!orderId) {
        throw new Error("Order ID tidak diterima");
      }

      if (!window.snap) {
        throw new Error("Midtrans Snap belum siap. Tunggu sebentar dan coba lagi.");
      }

      close();

      setTimeout(() => {
        window.snap!.pay(token, {
          onSuccess: async (result: { order_id?: string; transaction_status?: string }) => {
          const paidOrderId = result?.order_id || orderId;
          const status = result?.transaction_status;
          if (status !== "capture" && status !== "settlement") {
            showToast("Status pembayaran tidak valid. Silakan coba lagi.", "error");
            return;
          }

          const dbResult = await upgradeToProLifetime();
          if (!dbResult.success) {
            showToast(dbResult.error || "Gagal mengaktifkan akun Premium.", "error");
            return;
          }

          upgrade();
          setTheme("sultan");
          if (typeof window !== "undefined") {
            localStorage.setItem("remula-theme", "sultan");
          }
          close();
          showToast("Pembayaran Berhasil! Akun Anda sekarang Premium.", "success");
        },
        onPending: () => {
          showToast("Menunggu pembayaran. Silakan selesaikan pembayaran.", "success");
        },
        onError: () => {
          showToast("Pembayaran gagal. Silakan coba lagi.", "error");
        },
        onClose: () => {
          // User menutup popup tanpa membayar
        },
        });
      }, 150);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memproses pembayaran.", "error");
    } finally {
      setIsUpgrading(false);
    }
  };

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const canPay = Boolean(clientKey?.trim());

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={clientKey ?? ""}
        strategy="afterInteractive"
        onLoad={() => setSnapReady(true)}
      />
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className={cn(
          "border-amber-500/40 bg-gradient-to-br from-amber-950/95 via-black to-amber-900/80",
          "shadow-[0_0_40px_rgba(245,158,11,0.15)] max-w-md"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-400 text-center">
            Unlock Premium Forever
          </DialogTitle>
        </DialogHeader>

        <ul className="space-y-3">
          {BENEFITS.map(({ icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 text-amber-100/90"
            >
              <span className="text-xl">{icon}</span>
              <span className="font-medium">{text}</span>
            </li>
          ))}
        </ul>

        <p className="text-center text-amber-200/80 text-sm">
          Join smart users who master their finance completely.
        </p>

        {/* LIFETIME ACCESS — Satu penawaran eksklusif */}
        <div
          className={cn(
            "rounded-xl border-2 px-5 py-5",
            "border-amber-400/70 bg-gradient-to-br from-amber-900/50 to-amber-950/60",
            "shadow-[0_0_30px_rgba(245,158,11,0.2)]"
          )}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-lg font-bold text-amber-300 tracking-wide">LIFETIME ACCESS</span>
            <span className="text-xl">👑</span>
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-2xl font-bold text-amber-100" data-price={LIFETIME_PREMIUM_LABEL}>{LIFETIME_PREMIUM_LABEL}</span>
          </div>
          <p className="text-center text-amber-200/80 text-sm mt-3 leading-relaxed">
            Pay once. Own it forever. No monthly subscriptions, no hidden fees.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            onClick={handleUnlock}
            disabled={!user?.id || isUpgrading || !snapReady || !canPay}
            className={cn(
              "w-full py-4 text-lg font-bold",
              "bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950",
              "hover:from-amber-400 hover:to-amber-500",
              "border-2 border-amber-400/60 shadow-lg shadow-amber-500/25"
            )}
          >
            {isUpgrading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              "Unlock Premium"
            )}
          </Button>

          {/* Footer Links — Midtrans Compliance */}
          <footer className="pt-4 mt-4 border-t border-amber-500/20">
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <Link
                href="/terms"
                className="hover:text-amber-200/80 transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy"
                className="hover:text-amber-200/80 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/refund"
                className="hover:text-amber-200/80 transition-colors"
              >
                Refund Policy
              </Link>
              <a
                href="mailto:support@domainanda.com"
                className="hover:text-amber-200/80 transition-colors"
              >
                Contact Support
              </a>
            </nav>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
