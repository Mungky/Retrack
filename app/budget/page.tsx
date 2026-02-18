import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import BudgetClient from "@/components/BudgetClient";
import type { Budget, Category, Transaction } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getBudgets(userId: string | null): Promise<(Budget & { category: Category | null })[]> {
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("budgets")
      .select("*, category:categories(id, name, icon, color)")
      .eq("user_id", userId);

    if (error) throw error;

    return (data as (Budget & { category: Category | null })[]) || [];
  } catch (error) {
    console.error("Error fetching budgets:", error);
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

async function getExpensesThisMonth(userId: string | null): Promise<Transaction[]> {
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, type, date, category_id")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("date", startOfMonth)
      .lte("date", endOfMonth);

    if (error) throw error;
    return (data as Transaction[]) || [];
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export default async function BudgetPage() {
  const userId = await getServerUserId();
  const [budgetsWithCategory, categories, expensesThisMonth] = await Promise.all([
    getBudgets(userId),
    getCategories(userId),
    getExpensesThisMonth(userId),
  ]);

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      <BudgetClient
        initialBudgets={budgetsWithCategory}
        categories={categories}
        expensesThisMonth={expensesThisMonth}
      />
    </main>
  );
}
