"use client";

import { ChevronDown } from "lucide-react";
import { DATE_RANGE_OPTIONS, type DateRangeKey } from "@/lib/date-range";

interface DateRangeFilterProps {
  value: DateRangeKey;
  onChange: (range: DateRangeKey) => void;
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const currentLabel = DATE_RANGE_OPTIONS.find((o) => o.value === value)?.label ?? "This Month";

  return (
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DateRangeKey)}
        className="appearance-none pl-4 pr-10 py-2.5 rounded-full fintech-card border border-white/5 text-white text-sm font-medium cursor-pointer focus:outline-none focus:border-violet-500/50 transition-colors"
        style={{ colorScheme: "dark" }}
      >
        {DATE_RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#181A25] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
        size={18}
      />
    </div>
  );
}
