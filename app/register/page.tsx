"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { isRateLimited, getRemainingTime } from "@/lib/rate-limiter";

export default function RegisterPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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
    const rateLimitKey = `register:${email}`;
    if (isRateLimited(rateLimitKey, 3, 60000)) {
      const remaining = getRemainingTime(rateLimitKey);
      const seconds = Math.ceil(remaining / 1000);
      showToast(
        `Terlalu banyak percobaan. Silakan tunggu ${seconds} detik lagi.`,
        "error"
      );
      return;
    }

    if (password.length < 6) {
      showToast("Password minimal 6 karakter.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split("@")[0],
          },
        },
      });

      if (error) {
        if (error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("already exists")) {
          showToast("Email sudah terdaftar. Silakan login.", "error");
        } else if (error.message?.toLowerCase().includes("rate limit") || error.status === 429) {
          showToast("Terlalu banyak percobaan. Silakan tunggu beberapa saat.", "error");
        } else if (error.message?.toLowerCase().includes("invalid email")) {
          showToast("Format email tidak valid.", "error");
        } else {
          showToast(error.message || "Gagal mendaftar. Silakan coba lagi.", "error");
        }
        return;
      }

      showToast("Pendaftaran berhasil! Silakan login.", "success");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Register error:", error);
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
          <p className="text-slate-400">Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nama
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

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
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
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
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400">
            Sudah punya akun?{" "}
            <a
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Masuk sekarang
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
