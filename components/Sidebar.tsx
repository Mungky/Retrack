"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Home, BarChart3, PiggyBank, Wallet, User } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/transactions", label: "Transactions", icon: Wallet },
  { href: "/settings", label: "Settings", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
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
    <aside
      className={clsx(
        "hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 z-40",
        "backdrop-blur-xl pt-6 pb-4 px-4",
        isForest
          ? "bg-white/95 border-r border-emerald-200/50"
          : "bg-black/60 border-r border-white/10"
      )}
    >
      <Link href="/dashboard" className="mb-8 px-4">
        <span className={clsx("text-xl font-bold font-playfair", isForest ? "text-slate-800" : "text-white")}>Re-Start</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : isForest
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
