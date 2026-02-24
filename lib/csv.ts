import type { TransactionForExport } from "@/app/actions/export";

/**
 * Always wrap CSV text fields in double quotes to prevent column shift from commas.
 * Escapes inner quotes by doubling them.
 */
function quoteCSVField(value: string): string {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Format date as DD/MM/YYYY (e.g. 18/02/2026).
 * No time - transaction only stores date.
 */
function formatDateForCSV(dateStr: string): string {
  if (!dateStr) return "";
  const d = dateStr.trim();
  const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, day] = match;
    return `${day}/${m}/${y}`;
  }
  return d;
}

/**
 * Generate CSV string from transactions.
 * Headers: Date, Type, Category, Wallet, Amount, Note
 *
 * - Date: DD/MM/YYYY (local format)
 * - Amount: raw number, negative for expense (no "Rp", no thousands separator)
 * - Note, Category, Wallet: wrapped in quotes for comma safety
 */
export function generateCSV(transactions: TransactionForExport[]): string {
  const header = "Date,Type,Category,Wallet,Amount,Note";
  const rows = transactions.map((t) => {
    const date = quoteCSVField(formatDateForCSV(t.date));
    const type = quoteCSVField(t.type || "");
    const category = quoteCSVField(t.category?.name ?? "");
    const wallet =
      t.type === "transfer"
        ? `${t.source_wallet?.name ?? ""} → ${t.destination_wallet?.name ?? ""}`.trim()
        : t.source_wallet?.name ?? "";
    const amount = t.type === "expense" ? -Math.abs(t.amount) : Math.abs(t.amount);
    const note = quoteCSVField(t.description ?? "");

    return `${date},${type},${category},${quoteCSVField(wallet)},${amount},${note}`;
  });

  return [header, ...rows].join("\n");
}
