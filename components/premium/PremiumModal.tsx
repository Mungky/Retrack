"use client";

import { useState } from "react";
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
import { upgradeToProLifetime } from "@/app/actions/subscription";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

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
  const upgrade = useSubscriptionStore((s) => s.upgrade);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUnlock = async () => {
    if (!user?.id) return;
    try {
      setIsUpgrading(true);
      const res = await upgradeToProLifetime(user.id);
      if (res.success) {
        upgrade();
        close();
      }
    } catch (error) {
      console.error("Gagal upgrade ke Pro:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
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
            <del className="text-amber-200/50 text-base">$39.99</del>
            <span className="text-2xl font-bold text-amber-100">$19.99</span>
          </div>
          <p className="text-center text-amber-200/80 text-sm mt-3 leading-relaxed">
            Pay once. Own it forever. No monthly subscriptions, no hidden fees.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            onClick={handleUnlock}
            disabled={!user?.id || isUpgrading}
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
              "Get Lifetime Access - $19.99"
            )}
          </Button>

          <button
            type="button"
            onClick={() => close()}
            className="w-full py-2.5 text-sm text-amber-200/70 hover:text-amber-200 transition-colors underline underline-offset-2"
          >
            Restore Purchase
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
