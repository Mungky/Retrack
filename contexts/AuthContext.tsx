"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabaseClient } from "@/lib/supabase-client";
import type { User } from "@/types";

const MAX_LOADING_MS = 1000; // Jangan blokir UI > 1 detik

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** True hanya ketika getSession() selesai (bukan dari timeout). Untuk ThemeGuard. */
  sessionCheckComplete: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const finish = () => {
      if (mounted) setLoading(false);
    };

    timeoutRef.current = setTimeout(finish, MAX_LOADING_MS);

    supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted) {
        if (error) {
          console.warn("[AuthContext] getSession error:", error.message);
        }
        const u = session?.user ?? null;
        console.log("[AuthContext] Session from getSession:", u ? { id: u.id, email: u.email } : "null (no session)");
        setUser(u);
        setLoading(false);
        setSessionCheckComplete(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        console.log("[AuthContext] onAuthStateChange:", event, session?.user ? { id: session.user.id } : "null");
        setUser(session?.user ?? null);
        setLoading(false);
        setSessionCheckComplete(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabaseClient.auth.signOut();
    // Don't redirect here - let the component handle it with window.location
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionCheckComplete, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
