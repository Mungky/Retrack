"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ThemeSelectOption {
  value: string;
  label: string;
}

export interface ThemeSelectProps {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  options: ThemeSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ThemeSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className,
}: ThemeSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

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
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 border-0 border-b-2 border-input bg-transparent pl-0 pr-8 py-2 text-sm text-foreground cursor-pointer",
          "focus:outline-none focus:ring-0 focus:border-b-primary focus:border-b-2",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          !value && "text-muted-foreground",
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 py-1 max-h-[200px] overflow-y-auto rounded-xl bg-card border border-border shadow-xl z-[90]"
          role="listbox"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm transition-colors",
                value === opt.value ? "bg-primary/20 text-primary font-medium" : "text-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
