/**
 * Unified transaction calculation utility - SINGLE SOURCE OF TRUTH.
 * Use this for all Income/Expense/Net calculations across the app.
 * CRITICAL: Type comparison is case-insensitive (handles 'income', 'Income', 'INCOME', etc.)
 */

export type TransactionLike = { amount?: number; type?: string | null };

/**
 * Normalize transaction type for comparison.
 * Handles: 'income', 'Income', 'INCOME', null, undefined, whitespace.
 */
export function normalizeTransactionType(
  type: string | null | undefined
): string {
  return String(type ?? "").trim().toLowerCase();
}

/**
 * Returns true if the transaction is income (case-insensitive).
 */
export function isIncome(tx: TransactionLike): boolean {
  return normalizeTransactionType(tx.type) === "income";
}

/**
 * Returns true if the transaction is expense (case-insensitive).
 */
export function isExpense(tx: TransactionLike): boolean {
  return normalizeTransactionType(tx.type) === "expense";
}

export interface TransactionTotals {
  income: number;
  expense: number;
  net: number;
}

/**
 * Calculate totals from transactions (case-insensitive type check).
 */
export function calculateTotals<T extends TransactionLike>(
  transactions: T[]
): TransactionTotals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const amt = Number(t.amount ?? 0);
    if (isIncome(t)) income += amt;
    if (isExpense(t)) expense += amt;
  }
  return { income, expense, net: income - expense };
}

export interface DailyAggregate {
  date: string;
  income: number;
  expense: number;
}

/** Extract YYYY-MM-DD from date string (handles ISO with time) */
function dateOnly(s: string): string {
  return s.split("T")[0] || s;
}

/**
 * Aggregate transactions by date for chart data.
 */
export function aggregateByDate<T extends TransactionLike & { date: string }>(
  transactions: T[]
): DailyAggregate[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    const day = dateOnly(tx.date);
    if (!map.has(day)) map.set(day, { income: 0, expense: 0 });
    const bucket = map.get(day)!;
    const amt = Number(tx.amount ?? 0);
    if (isIncome(tx)) bucket.income += amt;
    if (isExpense(tx)) bucket.expense += amt;
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface CategoryPoint {
  name: string;
  value: number;
}

/**
 * Aggregate expenses by category for chart data.
 */
export function aggregateExpenseByCategory<T extends TransactionLike & { category_id?: string | null }>(
  transactions: T[],
  getCategoryName: (id: string | null) => string
): CategoryPoint[] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    if (!isExpense(tx)) continue;
    const name = getCategoryName(tx.category_id ?? null);
    map.set(name, (map.get(name) ?? 0) + Number(tx.amount ?? 0));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Aggregate income by category for chart data.
 */
export function aggregateIncomeByCategory<T extends TransactionLike & { category_id?: string | null }>(
  transactions: T[],
  getCategoryName: (id: string | null) => string
): CategoryPoint[] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    if (!isIncome(tx)) continue;
    const name = getCategoryName(tx.category_id ?? null);
    map.set(name, (map.get(name) ?? 0) + Number(tx.amount ?? 0));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
