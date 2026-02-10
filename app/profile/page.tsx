"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, LogOut, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      showToast("Logout berhasil!", "success");
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Logout error:", error);
      showToast("Gagal logout. Silakan coba lagi.", "error");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pb-32 px-4 py-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen pb-32 px-4 py-8">
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-12 text-center">
          <p className="text-slate-400">User tidak ditemukan</p>
        </div>
      </main>
    );
  }

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-slate-400 text-sm">Informasi akun Anda</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 border border-slate-800 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
              <User className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user.user_metadata?.name || user.email?.split("@")[0] || "User"}
              </h2>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50">
              <Mail className="text-cyan-400" size={20} />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-white font-semibold">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50">
              <Calendar className="text-cyan-400" size={20} />
              <div>
                <p className="text-xs text-slate-400">Bergabung pada</p>
                <p className="text-white font-semibold">{createdAt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </main>
  );
}
