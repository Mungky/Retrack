import { createClient } from "./supabase-server";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user from server-side session
 * Returns null if not authenticated
 */
export async function getServerUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.log("[getServerUser] No user on server:", error?.message ?? "no session");
    return null;
  }

  return user;
}

/**
 * Get the current authenticated user ID from server-side session
 * Returns null if not authenticated
 */
export async function getServerUserId(): Promise<string | null> {
  const user = await getServerUser();
  return user?.id || null;
}

/**
 * Require authentication - redirects to login if not authenticated
 * Returns the authenticated user
 */
export async function requireAuth() {
  const user = await getServerUser();
  
  if (!user) {
    redirect("/login");
  }

  return user;
}
