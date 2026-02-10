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
      <div className="relative p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-cyan-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all hover:scale-105 active:scale-95" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' }}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Icon */}
        <Sparkles className="relative z-10 text-purple-400 group-hover:text-purple-300 transition-colors" size={24} />
        
        {/* Notification Badge */}
        {notificationCount > 0 && (
          <div className="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center border-2 border-slate-950 shadow-lg animate-pulse">
            <span className="text-xs font-bold text-white">{notificationCount > 9 ? "9+" : notificationCount}</span>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {notificationCount > 0 && (
        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
          {notificationCount} transaksi baru
        </div>
      )}
    </div>
  );
}
