"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { isRateLimited, getRemainingTime } from "@/lib/rate-limiter";
import Link from "next/link";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PasswordStrength = "weak" | "medium" | "strong" | "empty";

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

function getErrorMessage(error: { message?: string; status?: number }): string {
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "Email sudah terdaftar. Silakan login.";
  }
  if (msg.includes("rate limit") || error.status === 429) {
    return "Terlalu banyak percobaan. Silakan tunggu beberapa saat.";
  }
  if (msg.includes("invalid email")) {
    return "Format email tidak valid.";
  }
  return error.message || "Gagal mendaftar. Silakan coba lagi.";
}

export default function RegisterPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (user) {
      window.location.href = "/";
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi tidak cocok.");
      return;
    }

    const rateLimitKey = `register:${email}`;
    if (isRateLimited(rateLimitKey, 3, 60000)) {
      const remaining = getRemainingTime(rateLimitKey);
      setError(`Terlalu banyak percobaan. Tunggu ${Math.ceil(remaining / 1000)} detik.`);
      return;
    }

    setIsLoading(true);
    try {
      const { error: authError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() || email.split("@")[0] },
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/`,
        },
      });

      if (authError) {
        setError(getErrorMessage(authError));
        return;
      }

      setEmailSent(true);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError(null);
    try {
      const { error: resendError } = await supabaseClient.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (resendError) {
        setError(getErrorMessage(resendError));
      } else {
        setError(null);
      }
    } catch {
      setError("Gagal mengirim ulang email.");
    } finally {
      setResendLoading(false);
    }
  };

  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0F111A]">
        <div className="w-full max-w-md">
          <div className="fintech-card p-8 border border-white/5 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-emerald-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Cek Email Anda</h1>
            <p className="text-white/60 text-sm mb-6">
              Kami telah mengirim link verifikasi ke <span className="text-white font-medium">{email}</span>.
              Buka email dan klik link untuk mengaktifkan akun.
            </p>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left">
                <AlertCircle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-rose-300 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Mengirim...
                </>
              ) : (
                "Kirim Ulang Email"
              )}
            </button>

            <p className="mt-6 text-white/50 text-sm">
              Sudah verifikasi?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
                Masuk sekarang
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0F111A]">
      <div className="w-full max-w-md">
        <div className="fintech-card p-8 border border-white/5 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-1 font-playfair">Remula Money</h1>
            <p className="text-white/50 text-sm">Buat akun baru</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <AlertCircle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Nama</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

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
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength === "weak"
                          ? "w-1/3 bg-rose-500"
                          : strength === "medium"
                          ? "w-2/3 bg-amber-500"
                          : "w-full bg-emerald-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      strength === "weak"
                        ? "text-rose-400"
                        : strength === "medium"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {strength === "weak" ? "Lemah" : strength === "medium" ? "Sedang" : "Kuat"}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-rose-400">Password tidak cocok</p>
              )}
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
                "Daftar"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-white/50 text-sm">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
              Masuk sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
