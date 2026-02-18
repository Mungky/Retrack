"use client";

import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatCurrencyFull } from "@/lib/currency";

interface BalanceCardProps {
  totalBalance: number;
}

export default function BalanceCard({ totalBalance }: BalanceCardProps) {
  const { user } = useAuth();
  const formatted = formatCurrency(totalBalance);
  const charCount = formatted.length;
  const fontSize =
    charCount > 14 ? "text-2xl" : charCount > 10 ? "text-3xl" : "text-4xl";

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="balance-card-gradient relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-900 p-6 min-h-[180px] flex flex-col justify-between">
      {/* Abstract decoration - subtle circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-8 w-16 h-16 bg-white/5 rounded-full" />

      {/* Top row: Total Balance label + User Profile */}
      <div className="relative z-10 flex items-start justify-between">
        <p className="text-white/80 text-sm font-medium">Total Balance</p>
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <User className="text-white" size={18} />
            </div>
          )}
          <span className="text-white font-semibold text-sm truncate max-w-[100px]">
            {displayName}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="relative z-10">
        <p
          className={`${fontSize} font-bold text-white leading-tight truncate`}
          style={{ maxWidth: "100%" }}
          title={formatCurrencyFull(totalBalance)}
        >
          {formatted}
        </p>
      </div>
    </div>
  );
}
