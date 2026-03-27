"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button, Input, Card } from "@/components/ui";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorMessage(error: { message?: string; status?: number }): string {
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("rate limit") || error.status === 429) {
    return "Too many attempts. Please wait a moment.";
  }
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "Invalid email or password. Please check again.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email not verified. Check your inbox for the verification link.";
  }
  return error.message || "Login failed. Please try again.";
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      window.location.replace("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
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

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card */}
        <Card variant="glass" className="p-8 border border-white/5 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-1 font-playfair">ReTrack</h1>
            <p className="text-white/50 text-sm">Sign in to your account</p>
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
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" size={20} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
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
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  required
                  className="pl-12 rounded-2xl h-12"
                  disabled={isLoading}
                />
              </div>
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
                "Sign In"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-white/50 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold">
              Sign up now
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
