/**
 * Financial cycle date utilities.
 * Supports Calendar (1-30/31) and Paycheck (custom start date) cycles.
 */

export type CycleType = "calendar" | "paycheck";

export interface CycleDateRange {
  startDate: Date;
  endDate: Date;
  startStr: string;
  endStr: string;
}

/**
 * Get date range for a given month based on cycle type.
 *
 * Calendar: startDate = 1st of month, endDate = last day of month
 * Paycheck: e.g. paycheckDate=25, selectedMonth=March 2026
 *   → startDate = 25 Feb 2026 00:00:00
 *   → endDate = 24 Mar 2026 23:59:59
 *
 * @param selectedMonth - The month to get the range for (e.g. March 2026)
 * @param cycleType - 'calendar' or 'paycheck'
 * @param paycheckDate - Day of month 1-31 (used when cycleType='paycheck')
 */
export function getCycleDateRange(
  selectedMonth: Date,
  cycleType: CycleType,
  paycheckDate: number
): CycleDateRange {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const day = Math.min(paycheckDate, 31);

  if (cycleType === "calendar") {
    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      startDate,
      endDate,
      startStr: toDateStr(startDate),
      endStr: toDateStr(endDate),
    };
  }

  // Paycheck: start = (paycheckDate) of previous month, end = (paycheckDate - 1) of current month
  // Clamp to valid days (e.g. Feb has 28 days, paycheckDate=31 → use 28)
  const lastDayPrevMonth = new Date(year, month, 0).getDate();
  const lastDayCurrMonth = new Date(year, month + 1, 0).getDate();
  const startDay = Math.min(day, lastDayPrevMonth);
  const endDay = day === 1 ? lastDayPrevMonth : Math.min(day - 1, lastDayCurrMonth);

  const startDate = new Date(year, month - 1, startDay, 0, 0, 0, 0);
  const endDate =
    day === 1
      ? new Date(year, month, 0, 23, 59, 59, 999) // last day of previous month
      : new Date(year, month, endDay, 23, 59, 59, 999);

  return {
    startDate,
    endDate,
    startStr: toDateStr(startDate),
    endStr: toDateStr(endDate),
  };
}

/** Format Date to YYYY-MM-DD (local timezone) */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
