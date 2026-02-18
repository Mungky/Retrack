import DashboardClient from "@/components/DashboardClient";
import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import type { Transaction, Wallet } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getWallets(): Promise<Wallet[]> {
  try {
    const userId = await getServerUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as Wallet[]) || [];
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return [];
  }
}

async function getTransactionsThisYear(userId: string | null): Promise<Transaction[]> {
  if (!userId) return [];
  try {
    const supabase = await createClient();
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0];
    const { data, error } = await supabase
      .from("transactions")
      .select("*, category:categories(id, name, icon, color)")
      .eq("user_id", userId)
      .gte("date", startOfYear)
      .order("date", { ascending: false });
    if (error) throw error;
    return (data as Transaction[]) || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const userId = await getServerUserId();
  const [wallets, transactions] = await Promise.all([
    getWallets(),
    getTransactionsThisYear(userId),
  ]);

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      <DashboardClient wallets={wallets} transactions={transactions} />
    </main>
  );
}
