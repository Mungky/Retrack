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
      .select("id, amount, type, date, category_id, category:categories(id, name, icon)")
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
    const [resPersonal, resGlobal] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", userId).order("name", { ascending: true }),
      supabase.from("categories").select("*").is("user_id", null).order("name", { ascending: true }),
    ]);

    if (resPersonal.error) throw resPersonal.error;
    if (resGlobal.error) throw resGlobal.error;

    const personal = (resPersonal.data as Category[]) || [];
    const global = (resGlobal.data as Category[]) || [];
    return [...global, ...personal].sort((a, b) => a.name.localeCompare(b.name));
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
