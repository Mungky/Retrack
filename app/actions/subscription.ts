"use server";

import { createClient } from "@/lib/supabase-server";

/**
 * Cek status Pro user dari database.
 * @returns true jika user memiliki Lifetime Access, false jika tidak atau error
 */
export async function getProStatus(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("isPro")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[getProStatus] Supabase error:", error.message, "userId:", userId);
    return false;
  }
  if (!data) {
    console.error("[getProStatus] No row found for userId:", userId);
    return false;
  }
  return data.isPro === true;
}

/**
 * Upgrade user ke Pro Lifetime (beli putus).
 * Dipanggil saat pembayaran sukses.
 */
export async function upgradeToProLifetime(userId: string): Promise<{ success: true }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ isPro: true })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  return { success: true };
}
