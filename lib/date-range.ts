export type DateRangeKey = "today" | "this_week" | "this_month" | "last_month" | "last_3_months" | "this_year";

export const DATE_RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "this_year", label: "This Year" },
];

export function getDateRange(range: DateRangeKey): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;

  switch (range) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "this_week": {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
      break;
    }
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end.setTime(start.getTime());
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of previous month
      break;
    }
    case "last_3_months":
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case "this_year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start, end };
}

/** Get today's date as YYYY-MM-DD in LOCAL timezone */
export function getTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format Date to YYYY-MM-DD using LOCAL timezone (not UTC) */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get all date strings (YYYY-MM-DD) in range, inclusive */
export function getDatesInRange(range: DateRangeKey): string[] {
  const { start, end } = getDateRange(range);
  const dates: string[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(toLocalDateString(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** Extract YYYY-MM-DD from date string (handles "2025-02-10" or "2025-02-10T00:00:00.000Z") */
export function toDateOnly(dateStr: string): string {
  return dateStr.split("T")[0] || dateStr;
}

export function filterTransactionsByRange<T extends { date: string }>(
  transactions: T[],
  range: DateRangeKey
): T[] {
  const { start, end } = getDateRange(range);
  const startStr = toLocalDateString(start);
  const endStr = toLocalDateString(end);
  return transactions.filter((t) => {
    const tDate = toDateOnly(t.date);
    return tDate >= startStr && tDate <= endStr;
  });
}
