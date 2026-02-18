"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-none border-0 border-b-2 border-input bg-transparent pl-0 pr-8 py-2 text-sm text-foreground appearance-none cursor-pointer",
            "focus:outline-none focus:ring-0 focus:border-b-primary focus:border-b-2",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            "placeholder:text-muted-foreground",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-0 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none"
          aria-hidden
        />
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
