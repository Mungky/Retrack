"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { clsx } from "clsx";

const MARKETING_PATHS = ["/", "/login", "/register", "/signup", "/terms", "/privacy"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketing = MARKETING_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  return (
    <>
      <Sidebar />
      <div
        className={clsx(
          "min-h-screen transition-[padding] duration-200",
          !isMarketing && "md:pl-64"
        )}
      >
        <div
          className={clsx(
            "relative z-10 w-full mx-auto transition-all duration-200",
            !isMarketing ? "max-w-4xl" : "max-w-6xl"
          )}
        >
          {children}
        </div>
        <BottomNav />
      </div>
    </>
  );
}
