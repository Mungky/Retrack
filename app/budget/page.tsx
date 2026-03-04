import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import BudgetClient from "@/components/BudgetClient";
import { getCycleDateRange, type CycleType } from "@/lib/dateUtils";
import { getCyclePrefs } from "@/app/actions/user";
import type { Budget, Category, Transaction } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getBudgets(userId: string | null): Promise<(Budget & { category: Category | null })[]> {
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("budgets")
      .select("*, category:categories(id, name, icon, color, type)")
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

function getMonthRange(cycleType: CycleType, paycheckDate: number) {
  const now = new Date();
  const { startStr, endStr } = getCycleDateRange(now, cycleType, paycheckDate);
  return { startOfMonth: startStr, endOfMonth: endStr };
}

async function getExpensesThisMonth(
  userId: string | null,
  cycleType: CycleType,
  paycheckDate: number
): Promise<Transaction[]> {
  if (!userId) return [];
  try {
    const supabase = await createClient();
    const { startOfMonth, endOfMonth } = getMonthRange(cycleType, paycheckDate);
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

async function getIncomeThisMonth(
  userId: string | null,
  cycleType: CycleType,
  paycheckDate: number
): Promise<Transaction[]> {
  if (!userId) return [];
  try {
    const supabase = await createClient();
    const { startOfMonth, endOfMonth } = getMonthRange(cycleType, paycheckDate);
    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, type, date, category_id")
      .eq("user_id", userId)
      .eq("type", "income")
      .gte("date", startOfMonth)
      .lte("date", endOfMonth);

    if (error) throw error;
    return (data as Transaction[]) || [];
  } catch (error) {
    console.error("Error fetching income:", error);
    return [];
  }
}

export default async function BudgetPage() {
  const userId = await getServerUserId();
  const cyclePrefs = await getCyclePrefs();
  const cycleType = cyclePrefs?.cycleType ?? "calendar";
  const paycheckDate = cyclePrefs?.paycheckDate ?? 1;

  const [budgetsWithCategory, categories, expensesThisMonth, incomeThisMonth] = await Promise.all([
    getBudgets(userId),
    getCategories(userId),
    getExpensesThisMonth(userId, cycleType, paycheckDate),
    getIncomeThisMonth(userId, cycleType, paycheckDate),
  ]);

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      <BudgetClient
        initialBudgets={budgetsWithCategory}
        categories={categories}
        expensesThisMonth={expensesThisMonth}
        incomeThisMonth={incomeThisMonth}
      />
    </main>
  );
}
