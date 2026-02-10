"use server";

import { revalidatePath } from "next/cache";

/**
 * Invalidates the Next.js cache for pages that display transaction data.
 * Call this after any transaction mutation (add, edit, delete) so that
 * Dashboard, Statistics, Transactions, and Stats pages show fresh data
 * when the user navigates to them.
 */
export async function revalidateTransactionPaths() {
  revalidatePath("/");
  revalidatePath("/statistics");
  revalidatePath("/transactions");
  revalidatePath("/budget");
}
