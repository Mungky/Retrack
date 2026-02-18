"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-white/5 px-4 py-3 text-foreground placeholder:text-white/30",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:ring-offset-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
