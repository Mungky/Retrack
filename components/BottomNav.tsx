"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Wallet, User } from "lucide-react";
import { useSheet } from "@/contexts/SheetContext";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/transactions", label: "Transactions", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isSheetOpen } = useSheet();

  // Hide navbar on auth pages
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  return (
    <nav 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md transition-all duration-300 ${
        isSheetOpen ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 pointer-events-auto translate-y-0"
      }`}
    >
      <div className="relative rounded-3xl bg-gradient-to-br from-[#141b3d]/90 via-[#1a2342]/90 to-[#0f172a]/90 backdrop-blur-2xl border border-white/10 px-4 py-3" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)' }}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-emerald-500/10 rounded-3xl blur-xl"></div>
        
        <div className="relative z-10 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "text-cyan-400 scale-110"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
                )}
                
                <Icon
                  size={22}
                  className={`relative z-10 transition-transform duration-300 ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                <span
                  className={`text-xs font-semibold relative z-10 transition-all duration-300 ${
                    isActive ? "text-cyan-400" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Active dot */}
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-cyan-400"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
