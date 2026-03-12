import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getServerUserId } from "@/lib/auth-helpers";

const VALID_THEMES = ["default", "sultan", "forest"] as const;

export async function GET() {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ isPro: false, theme: "default", cyclePrefs: null });
  }

  const supabase = await createClient();
  const { data: userData, error } = await supabase
    .from("users")
    .select("isPro, theme, cycle_type, paycheck_date")
    .eq("id", userId)
    .single();

  if (error || !userData) {
    return NextResponse.json({ isPro: false, theme: "default", cyclePrefs: null });
  }

  const row = userData as Record<string, unknown>;
  const isPro = row.isPro === true;
  const themeRaw = row.theme;
  const theme =
    themeRaw && VALID_THEMES.includes(themeRaw as (typeof VALID_THEMES)[number])
      ? (themeRaw as string)
      : "default";

  const cycleType = row.cycle_type === "paycheck" ? "paycheck" : "calendar";
  const paycheckDate = Math.max(1, Math.min(31, Number(row.paycheck_date) || 1));

  return NextResponse.json({
    isPro,
    theme,
    cyclePrefs: { cycleType, paycheckDate },
  });
}
