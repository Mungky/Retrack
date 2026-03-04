"use client";

import { useState, useEffect } from "react";
import { Calendar, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCycleStore } from "@/stores/cycleStore";
import { useToast } from "@/contexts/ToastContext";
import { updateCyclePrefs } from "@/app/actions/user";
import type { CycleType } from "@/stores/cycleStore";

export default function FinancialCycleSettings() {
  const { showToast } = useToast();
  const cycleType = useCycleStore((s) => s.cycleType);
  const paycheckDate = useCycleStore((s) => s.paycheckDate);
  const setCycle = useCycleStore((s) => s.setCycle);

  const [localCycleType, setLocalCycleType] = useState<CycleType>(cycleType);
  const [localPaycheckDate, setLocalPaycheckDate] = useState(paycheckDate);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalCycleType(cycleType);
    setLocalPaycheckDate(paycheckDate);
  }, [cycleType, paycheckDate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateCyclePrefs(localCycleType, localPaycheckDate);
      if (result.success) {
        setCycle(localCycleType, localPaycheckDate);
        showToast("Financial cycle saved successfully", "success");
      } else {
        showToast(result.error ?? "Failed to save", "error");
      }
    } catch {
      showToast("Failed to save financial cycle", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    localCycleType !== cycleType || localPaycheckDate !== paycheckDate;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Financial Cycle
      </h3>
      <div className="glass-card p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose how your monthly summary is calculated: by calendar (1–31) or
          by your paycheck date.
        </p>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-card-foreground">
            Cycle Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setLocalCycleType("calendar")}
              className={cn(
                "flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                localCycleType === "calendar"
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/50"
              )}
            >
              <Calendar className="text-primary" size={24} />
              <div className="text-left">
                <p className="font-semibold text-card-foreground">
                  Calendar Cycle
                </p>
                <p className="text-xs text-muted-foreground">
                  Days 1–30/31
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLocalCycleType("paycheck")}
              className={cn(
                "flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                localCycleType === "paycheck"
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/50"
              )}
            >
              <Wallet className="text-primary" size={24} />
              <div className="text-left">
                <p className="font-semibold text-card-foreground">
                  Paycheck Cycle
                </p>
                <p className="text-xs text-muted-foreground">
                  Paycheck cycle
                </p>
              </div>
            </button>
          </div>
        </div>

        {localCycleType === "paycheck" && (
          <div className="space-y-2">
            <label
              htmlFor="paycheck-date"
              className="block text-sm font-medium text-card-foreground"
            >
              Paycheck Date (Cycle Start)
            </label>
            <select
              id="paycheck-date"
              value={localPaycheckDate}
              onChange={(e) =>
                setLocalPaycheckDate(Number(e.target.value))
              }
              className="w-full h-10 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasChanges && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        )}
      </div>
    </div>
  );
}
