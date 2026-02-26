"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { DATE_RANGE_OPTIONS, type DateRangeKey } from "@/lib/date-range";

interface DateRangeFilterProps {
  value: DateRangeKey;
  onChange: (range: DateRangeKey) => void;
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel = DATE_RANGE_OPTIONS.find((o) => o.value === value)?.label ?? "Today";

  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref} className="relative flex justify-end sm:justify-end">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 pl-4 pr-4 py-2.5 rounded-full fintech-card border border-border text-foreground text-sm font-medium cursor-pointer focus:outline-none focus:border-primary/50 transition-colors min-w-[140px] justify-between"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{currentLabel}</span>
          <ChevronDown
            className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            size={18}
          />
        </button>
        {open && (
          <div
            className="absolute right-0 top-full mt-2 py-1 min-w-[160px] rounded-xl bg-card border border-border shadow-xl z-[90]"
            role="listbox"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={value === opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  value === opt.value
                    ? "bg-primary/20 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
