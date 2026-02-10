"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Wallet, User, PiggyBank } from "lucide-react";
import { useSheet } from "@/contexts/SheetContext";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/transactions", label: "Transactions", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isSheetOpen } = useSheet();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  return (
    <nav
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isSheetOpen
          ? "opacity-0 pointer-events-none translate-y-4"
          : "opacity-100 pointer-events-auto translate-y-0"
      }`}
    >
      {/* Floating Island - capsule, not touching edges */}
      <div
        className="px-6 py-3 rounded-full backdrop-blur-md"
        style={{ backgroundColor: "rgba(24, 26, 37, 0.9)" }}
      >
        <div className="flex items-center justify-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-full transition-all duration-200 ${
                  isActive ? "text-violet-400" : "text-white/50 hover:text-white/80"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-violet-500/20" />
                )}
                <Icon
                  size={22}
                  className={`relative z-10 transition-all ${
                    isActive ? "drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" : ""
                  }`}
                />
                <span
                  className={`relative z-10 text-xs font-semibold ${
                    isActive ? "text-violet-400" : "text-white/50"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
