"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { isRateLimited, getRemainingTime } from "@/lib/rate-limiter";
import Link from "next/link";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorMessage(error: { message?: string; status?: number }): string {
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("rate limit") || error.status === 429) {
    return "Terlalu banyak percobaan. Silakan tunggu beberapa saat.";
  }
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "Email atau password salah. Periksa kembali.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email belum terverifikasi. Cek inbox untuk link verifikasi.";
  }
  return error.message || "Gagal login. Silakan coba lagi.";
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      window.location.replace("/");
    }
  }, [loading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }

    const rateLimitKey = `login:${email}`;
    if (isRateLimited(rateLimitKey, 5, 60000)) {
      const remaining = getRemainingTime(rateLimitKey);
      setError(`Terlalu banyak percobaan. Tunggu ${Math.ceil(remaining / 1000)} detik.`);
      return;
    }

    setIsLoading(true);
    try {
      const { error: authError } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(getErrorMessage(authError));
        return;
      }

      await new Promise((r) => setTimeout(r, 300));
      window.location.replace("/");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0F111A]">
        <div className="animate-pulse text-white/50">Memuat...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0F111A]">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="fintech-card p-8 border border-white/5 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-1 font-playfair">Remula Money</h1>
            <p className="text-white/50 text-sm">Masuk ke akun Anda</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <AlertCircle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:opacity-95 active:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Memproses...</span>
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-white/50 text-sm">
            Belum punya akun?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
