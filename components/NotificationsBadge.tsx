"use client";

import { useState, useEffect } from "react";
import { Lock, Sparkles } from "lucide-react";
import NotificationSheet from "./NotificationSheet";
import { createBrowserClient } from "@supabase/ssr";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { usePremiumModal } from "@/stores/premiumModalStore";
import { cn } from "@/lib/cn";

export const REFRESH_NOTIFICATIONS_EVENT = "refresh-notifications";

export default function NotificationsBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const { open: openPremium } = usePremiumModal();
  
  // State visual untuk debugging (Bisa dihapus nanti)
  const [debugStatus, setDebugStatus] = useState<string>(""); 

  useEffect(() => {
    // 1. Buat Client Local (Wajib biar dapet cookie terbaru)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const checkUnread = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("BADGE: User not ready yet...");
          return;
        }

        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false); // RLS otomatis filter user_id, tapi amannya gini

        if (!error) {
          const isUnread = (count ?? 0) > 0;
          console.log(`BADGE: Found ${count} unread items. Status: ${isUnread}`);
          setHasUnread(isUnread);
          setDebugStatus(isUnread ? "Active" : "Inactive");
        }
      } catch (err) {
        console.error("BADGE CHECK FAILED:", err);
      }
    };

    // 2. STRATEGI "TEMBAK BERTUBI-TUBI" (Polling)
    // Cek sekarang (0ms)
    checkUnread();
    
    // Cek lagi setelah 1 detik (1000ms) - buat jaga-jaga kalau auth telat
    const timer1 = setTimeout(checkUnread, 1000);
    
    // Cek lagi setelah 3 detik (3000ms) - buat koneksi lemot
    const timer2 = setTimeout(checkUnread, 3000);

    // 3. EVENT LISTENER (Tetap dipasang)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) checkUnread();
    });

    const onRefresh = () => checkUnread();
    window.addEventListener(REFRESH_NOTIFICATIONS_EVENT, onRefresh);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      subscription.unsubscribe();
      window.removeEventListener(REFRESH_NOTIFICATIONS_EVENT, onRefresh);
    };
  }, []);

  const handleClick = () => {
    if (!isPro) {
      openPremium();
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "relative p-3 rounded-2xl glass-card border-white/10 hover:border-purple-500/40 transition-all hover:scale-105 active:scale-95 group",
          !isPro && "opacity-80"
        )}
        aria-label="Financial Highlights"
      >
        {/* ICON: Lock jika Free, Sparkles jika Pro */}
        {!isPro ? (
          <Lock className="relative z-10 text-amber-500" size={24} />
        ) : (
          <Sparkles
            className={`relative z-10 transition-all duration-500 ${
              hasUnread
                ? "text-amber-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] fill-amber-400/20"
                : "text-zinc-400 group-hover:text-zinc-300"
            }`}
            size={24}
          />
        )}

        {/* TITIK MERAH (VISUAL INDICATOR TAMBAHAN) - hanya Pro */}
        {isPro && hasUnread && (
          <span className="absolute top-2 right-2 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-[#0f172a]"></span>
          </span>
        )}
      </button>

      <NotificationSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUnreadChange={setHasUnread}
      />
    </>
  );
}