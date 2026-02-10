"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { isRateLimited, getRemainingTime } from "@/lib/rate-limiter";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = "/";
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit
    const rateLimitKey = `login:${email}`;
    if (isRateLimited(rateLimitKey, 5, 60000)) {
      const remaining = getRemainingTime(rateLimitKey);
      const seconds = Math.ceil(remaining / 1000);
      showToast(
        `Terlalu banyak percobaan login. Silakan tunggu ${seconds} detik lagi.`,
        "error"
      );
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("rate limit") || error.status === 429) {
          showToast("Terlalu banyak percobaan login. Silakan tunggu beberapa saat.", "error");
        } else if (error.message?.toLowerCase().includes("invalid login")) {
          showToast("Email atau password salah.", "error");
        } else {
          showToast(error.message || "Gagal login. Silakan coba lagi.", "error");
        }
        return;
      }

      showToast("Login berhasil!", "success");
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = "/";
    } catch (error: any) {
      console.error("Login error:", error);
      showToast("Terjadi kesalahan. Silakan coba lagi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Money Tracker</h1>
          <p className="text-slate-400">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Memproses...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400">
            Belum punya akun?{" "}
            <a
              href="/register"
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Daftar sekarang
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
