export type FormAccent = "emerald" | "rose" | "blue" | "violet" | "cyan";

/** Flushed/underline base style for form inputs (no box, bg-transparent, border-b only) */
export const FORM_INPUT_FLUSHED =
  "w-full rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-2 text-sm text-foreground focus:outline-none focus:ring-0 focus:border-b-primary focus:border-b-2 transition-colors";

export interface FormTheme {
  /** Focus style for flushed inputs - border-bottom to primary (no ring) */
  inputFocus: string;
  /** Gradient classes for submit button */
  submitGradient: string;
  /** Box-shadow value for submit button glow */
  submitShadow: string;
  /** Border class for selected items (categories, wallet types, etc.) */
  selectedBorder: string;
  /** Subtle background tint for the sheet container */
  bgTint: string;
}

export const formThemes: Record<FormAccent, FormTheme> = {
  emerald: {
    inputFocus: "focus:ring-0 focus:border-b-primary focus:border-b-2",
    submitGradient: "bg-gradient-to-r from-emerald-500 to-green-600",
    submitShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
    selectedBorder: "border-emerald-500/50",
    bgTint: "bg-emerald-950/20",
  },
  rose: {
    inputFocus: "focus:ring-0 focus:border-b-primary focus:border-b-2",
    submitGradient: "bg-gradient-to-r from-rose-500 to-red-600",
    submitShadow: "0 4px 14px rgba(244, 63, 94, 0.35)",
    selectedBorder: "border-rose-500/50",
    bgTint: "bg-rose-950/20",
  },
  blue: {
    inputFocus: "focus:ring-0 focus:border-b-primary focus:border-b-2",
    submitGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
    submitShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
    selectedBorder: "border-blue-500/50",
    bgTint: "bg-blue-950/20",
  },
  violet: {
    inputFocus: "focus:ring-0 focus:border-b-primary focus:border-b-2",
    submitGradient: "bg-gradient-to-r from-violet-500 to-purple-600",
    submitShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
    selectedBorder: "border-violet-500/50",
    bgTint: "bg-violet-950/20",
  },
  cyan: {
    inputFocus: "focus:ring-0 focus:border-b-primary focus:border-b-2",
    submitGradient: "bg-gradient-to-r from-cyan-500 to-blue-600",
    submitShadow: "0 4px 14px rgba(6, 182, 212, 0.35)",
    selectedBorder: "border-cyan-500/50",
    bgTint: "bg-cyan-950/20",
  },
};

export function getTransactionAccent(
  type: "income" | "expense" | "transfer"
): FormAccent {
  switch (type) {
    case "income":
      return "emerald";
    case "expense":
      return "rose";
    case "transfer":
      return "blue";
  }
}
