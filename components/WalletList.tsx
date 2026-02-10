import { CreditCard, Smartphone, Wallet, TrendingUp } from "lucide-react";
import type { Wallet as WalletType } from "@/types";

interface WalletListProps {
  wallets: WalletType[];
}

const getWalletIcon = (type: string) => {
  switch (type) {
    case "bank":
      return CreditCard;
    case "ewallet":
      return Smartphone;
    case "cash":
      return Wallet;
    default:
      return Wallet;
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

export default function WalletList({ wallets }: WalletListProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white">My Accounts</h2>
        <div className="flex items-center gap-2 text-cyan-400">
          <TrendingUp size={16} />
          <span className="text-sm font-medium">{wallets.length} Account{wallets.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="space-y-3">
        {wallets.map((wallet) => {
          const Icon = getWalletIcon(wallet.type);
          const config = getWalletConfig(wallet.type);

          return (
            <div
              key={wallet.id}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} border ${config.border} p-5 hover:scale-[1.02] transition-all duration-300`}
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="relative z-10 flex items-center justify-between">
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`relative p-3 rounded-xl bg-gradient-to-br ${config.gradient} border ${config.border} ${config.iconColor}`}>
                    <Icon size={24} className="relative z-10" />
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
