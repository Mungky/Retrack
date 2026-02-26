"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button, Input } from "@/components/ui";

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
    return "Email already registered. Please sign in.";
  }
  if (msg.includes("rate limit") || error.status === 429) {
    return "Too many attempts. Please wait a moment.";
  }
  if (msg.includes("invalid email")) {
    return "Invalid email format.";
  }
  return error.message || "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const { user, loading } = useAuth();
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
    if (!loading && user) {
      window.location.replace("/dashboard");
    }
  }, [loading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Invalid email format.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: authError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() || email.split("@")[0] },
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/dashboard`,
        },
      });

      if (authError) {
        setError(getErrorMessage(authError));
        return;
      }

      if (!authError && data?.user?.identities?.length === 0) {
        setError("Email sudah terdaftar. Silakan Login.");
        return;
      }

      setEmailSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
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
      setError("Failed to resend email.");
    } finally {
      setResendLoading(false);
    }
  };

  if (loading && !emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192x192.png" alt="Re" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-bold text-white font-playfair">- Start</span>
          </div>
          <div className="h-1 w-16 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-1/2 animate-pulse bg-primary rounded-full" />
          </div>
        </div>
      </main>
    );
  }

  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
        <div className="w-full max-w-md">
          <div className="fintech-card p-8 border border-white/5 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-emerald-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-white/60 text-sm mb-6">
              We sent a verification link to <span className="text-white font-medium">{email}</span>.
              Open your email and click the link to activate your account.
            </p>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left">
                <AlertCircle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-rose-300 text-sm">{error}</p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                "Resend Email"
              )}
            </Button>

            <p className="mt-6 text-white/50 text-sm">
              Already verified?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
                Sign in now
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-md">
        <div className="fintech-card p-8 border border-white/5 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-1 font-playfair">Re-Start</h1>
            <p className="text-white/50 text-sm">Create a new account</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <AlertCircle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" size={20} />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="pl-12 rounded-2xl h-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" size={20} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="pl-12 rounded-2xl h-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" size={20} />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="pl-12 rounded-2xl h-12"
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
                    {strength === "weak" ? "Weak" : strength === "medium" ? "Medium" : "Strong"}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" size={20} />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  minLength={6}
                  className="pl-12 rounded-2xl h-12"
                  disabled={isLoading}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-rose-400">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-white/50 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
              Sign in now
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
