"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationsBadge() {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setNotificationCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        // Get recent transactions (last 7 days) as notifications
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabaseClient
          .from("transactions")
          .select("id")
          .eq("user_id", user.id)
          .gte("date", sevenDaysAgo.toISOString().split("T")[0])
          .order("date", { ascending: false })
          .limit(10);

        if (!error && data) {
          setNotificationCount(data.length);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabaseClient
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="relative group cursor-pointer">
      <div className="relative p-3 rounded-2xl glass-card border-purple-500/30 hover:border-purple-500/50 transition-all hover:scale-105 active:scale-95">
        <Sparkles className="relative z-10 text-purple-400 group-hover:text-purple-300 transition-colors" size={24} />
        {notificationCount > 0 && (
          <div className="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center border-2 border-[#0f172a] shadow-lg animate-pulse">
            <span className="text-xs font-bold text-white">{notificationCount > 9 ? "9+" : notificationCount}</span>
          </div>
        )}
      </div>
      {notificationCount > 0 && (
        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 rounded-lg glass-card text-xs text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
          {notificationCount} transaksi baru
        </div>
      )}
    </div>
  );
}
