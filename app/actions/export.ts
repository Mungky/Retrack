"use server";

import { createClient } from "@/lib/supabase-server";
import { getServerUserId } from "@/lib/auth-helpers";

export interface TransactionForExport {
  id: string;
  amount: number;
  type: string;
  date: string;
  description?: string | null;
  category?: { id: string; name: string; icon?: string | null; color?: string | null } | null;
  source_wallet?: { id: string; name: string } | null;
  destination_wallet?: { id: string; name: string } | null;
}

export type ExportResult =
  | { success: true; data: TransactionForExport[] }
  | { success: false; error: string };

/**
 * Ambil semua transaksi user dalam rentang tanggal untuk ekspor CSV.
 */
export async function getAllTransactionsForExport(
  startDate: string,
  endDate: string
): Promise<ExportResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id,
        amount,
        type,
        date,
        description,
        category:categories(id, name, icon, color),
        source_wallet:wallets!source_wallet_id(id, name),
        destination_wallet:wallets!destination_wallet_id(id, name)
      `)
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("Export fetch error:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data as unknown as TransactionForExport[]) || [],
    };
  } catch (err) {
    console.error("Error in getAllTransactionsForExport:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to export transactions",
    };
  }
}
