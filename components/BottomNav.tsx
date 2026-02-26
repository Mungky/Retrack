"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Home, BarChart3, PiggyBank, Wallet, User } from "lucide-react";
import { useSheet } from "@/contexts/SheetContext";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/transactions", label: "Transactions", icon: Wallet },
  { href: "/settings", label: "Settings", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isSheetOpen } = useSheet();
  const { resolvedTheme } = useTheme();
  const isForest = resolvedTheme === "forest";

  const isLandingOrAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/terms" ||
    pathname === "/privacy";
  if (isLandingOrAuthPage) return null;

  return (
    <nav
      className={clsx(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
        "backdrop-blur-xl border-t nav-backdrop",
        "pb-[env(safe-area-inset-bottom)]",
        isSheetOpen && "opacity-0 pointer-events-none translate-y-full",
        !isForest && "bg-black/80 border-white/10"
      )}
    >
      <div className="flex items-center justify-center gap-0.5 px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-full min-w-[48px]",
                isActive ? "text-primary" : isForest ? "text-slate-500 hover:text-slate-800" : "text-white/50 hover:text-white/80"
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-primary/20" />
              )}
              <Icon size={20} className="relative z-10" strokeWidth={2} />
              <span className="relative z-10 text-[10px] font-semibold leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
