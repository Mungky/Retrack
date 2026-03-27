"use client";

import { useState } from "react";
import { Download, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { usePremiumModal } from "@/stores/premiumModalStore";
import { getAllTransactionsForExport } from "@/app/actions/export";
import { generateCSV } from "@/lib/csv";
import { TOAST_MESSAGES } from "@/lib/toast-messages";

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getTodayYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getFirstOfMonthYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function DataExport() {
  const { showToast } = useToast();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const { open: openPremium } = usePremiumModal();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(getFirstOfMonthYYYYMMDD());
  const [endDate, setEndDate] = useState(getTodayYYYYMMDD());

  const isValidRange =
    startDate &&
    endDate &&
    new Date(startDate).getTime() <= new Date(endDate).getTime();

  const handleExport = async () => {
    if (!isValidRange) return;
    setLoading(true);
    try {
      const result = await getAllTransactionsForExport(startDate, endDate);
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      const csv = generateCSV(result.data);
      const dateStr = new Date().toISOString().slice(0, 10);
      triggerDownload(csv, `my_money_backup_${dateStr}.csv`);
      showToast(TOAST_MESSAGES.SUCCESS.EXPORT_SUCCESS, "success");
    } catch (err) {
      console.error("Export error:", err);
      showToast(TOAST_MESSAGES.ERROR.GENERIC, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleExport}
        disabled={!isValidRange || loading}
        className="w-full justify-center gap-3 py-4 rounded-xl border-border hover:border-primary/30"
      >
        {loading ? (
          <Loader2 className="animate-spin text-primary" size={20} />
        ) : (
          <Download className="text-primary" size={20} />
        )}
        <span>Export CSV</span>
      </Button>
    </div>
  );
}
