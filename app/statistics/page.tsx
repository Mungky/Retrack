import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import StatisticsTabs from "@/components/StatisticsTabs";
import type { Category, Transaction } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getTransactionsThisYear(userId: string | null): Promise<Transaction[]> {
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const now = new Date();
    const startOfYear = `${now.getFullYear()}-01-01`;
    const endOfYear = `${now.getFullYear()}-12-31`;

    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, type, date, category_id, category:categories(id, name, icon, color)")
      .eq("user_id", userId)
      .gte("date", startOfYear)
      .lte("date", endOfYear)
      .order("date", { ascending: true });

    if (error) {
      console.error("Statistics page Supabase transactions error:", error);
      return [];
    }
    return (data as unknown as Transaction[]) || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

async function getCategories(userId: string | null): Promise<Category[]> {
  if (!userId) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error) throw error;
    return ((data as Category[]) || []).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function StatisticsPage() {
  const userId = await getServerUserId();
  const [transactions, categories] = await Promise.all([
    getTransactionsThisYear(userId),
    getCategories(userId),
  ]);

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      <StatisticsTabs transactions={transactions} categories={categories} />
    </main>
  );
}
