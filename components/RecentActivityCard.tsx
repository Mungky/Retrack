"use client";

import { useRouter } from "next/navigation";
import { ArrowDownRight } from "lucide-react";

export default function RecentActivityCard() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/transactions");
  };

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-purple-600/20 border border-purple-500/30 p-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="p-2.5 rounded-xl bg-purple-500/20 w-fit mb-3">
          <ArrowDownRight className="text-purple-400" size={20} />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Recent Activity</h3>
        <p className="text-xs text-slate-400">View transactions</p>
      </div>
    </div>
  );
}
