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
      className="group glass-card p-5 hover:border-white/20 transition-all duration-300 cursor-pointer"
    >
      <div className="relative z-10">
        <div className="p-2.5 rounded-xl bg-amber-500/20 w-fit mb-3">
          <ArrowDownRight className="text-amber-400" size={20} />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Recent Activity</h3>
        <p className="text-xs text-white/60">View transactions</p>
      </div>
    </div>
  );
}
