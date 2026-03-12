"use server";

import { createClient } from "@/lib/supabase-server";
import { getServerUserId } from "@/lib/auth-helpers";

export type SubscriptionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Cek status Pro user dari database.
 * Mengambil userId dari sesi server (tidak menerima parameter dari client).
 * @returns true jika user memiliki Lifetime Access, false jika tidak atau error
 */
export async function getProStatus(): Promise<boolean> {
  const userId = await getServerUserId();
  if (!userId) return false;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("isPro")
    .eq("id", userId)
    .single();

  if (error || !data) return false;
  return (data as { isPro?: boolean }).isPro === true;
}

/**
 * Upgrade user ke Pro Lifetime (beli putus).
 * Mengambil userId dari sesi server (tidak menerima parameter dari client).
 * Dipanggil saat pembayaran sukses (onSuccess Midtrans).
 * Update: isPro = true, theme = 'sultan'.
 */
export async function upgradeToProLifetime(): Promise<SubscriptionResult> {
  const userId = await getServerUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ isPro: true, theme: "sultan" })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
