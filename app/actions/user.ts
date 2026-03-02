"use server";

import { createClient } from "@/lib/supabase-server";
import { getServerUserId } from "@/lib/auth-helpers";

export type ThemeId = "default" | "sultan" | "forest";

const VALID_THEMES: ThemeId[] = ["default", "sultan", "forest"];
const PREMIUM_THEMES: ThemeId[] = ["sultan", "forest"];

export type ProStatusAndTheme = { isPro: boolean; theme: ThemeId } | null;

export type UpdateThemeResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Ambil tema user dari database.
 * @returns theme string atau null jika tidak login / error
 */
export async function getUserTheme(): Promise<ThemeId | null> {
  const userId = await getServerUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("theme")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  const raw = data as { theme?: string };
  const theme = raw.theme;
  if (theme && VALID_THEMES.includes(theme as ThemeId)) {
    return theme as ThemeId;
  }
  return "default";
}

/**
 * Update tema user di database.
 * Validasi: tema sultan/forest hanya boleh untuk user Pro.
 * @returns UpdateThemeResult
 */
export async function updateUserTheme(theme: string): Promise<UpdateThemeResult> {
  const userId = await getServerUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const themeId = theme as ThemeId;
  if (!VALID_THEMES.includes(themeId)) {
    return { success: false, error: "Invalid theme" };
  }

  if (PREMIUM_THEMES.includes(themeId)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("is_pro, isPro")
      .eq("id", userId)
      .single();

    const row = data as { is_pro?: boolean; isPro?: boolean } | null;
    const isPro = row && (row.is_pro === true || row.isPro === true);
    if (!isPro) {
      return { success: false, error: "Premium theme requires Pro subscription" };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ theme: themeId })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Ambil status Pro dan tema dalam satu query (untuk sinkronisasi awal).
 */
export async function getProStatusAndTheme(): Promise<ProStatusAndTheme> {
  const userId = await getServerUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("is_pro, isPro, theme")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  const row = data as { is_pro?: boolean; isPro?: boolean; theme?: string };
  const isPro = row.is_pro === true || row.isPro === true;
  const theme = (row.theme && VALID_THEMES.includes(row.theme as ThemeId))
    ? (row.theme as ThemeId)
    : "default";
  return { isPro, theme };
}
