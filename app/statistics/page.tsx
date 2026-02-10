import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import StatisticsClient from "@/components/StatisticsClient";
import type { Category, Transaction } from "@/types";

async function getMonthlyTransactions(userId: string | null) {
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startOfMonth.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (error) throw error;
    return (data as Transaction[]) || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

async function getCategories(userId: string | null) {
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as Category[]) || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function StatisticsPage() {
  const userId = await getServerUserId();
  const transactions = await getMonthlyTransactions(userId);
  const categories = await getCategories(userId);

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Statistics</h1>
        <p className="text-slate-400 text-sm">Analisis keuangan Anda</p>
      </div>

      <StatisticsClient transactions={transactions} categories={categories} />
    </main>
  );
}
