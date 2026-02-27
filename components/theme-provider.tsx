"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

type Theme = "default" | "sultan" | "forest";

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  attribute = "data-theme",
  defaultTheme = "default",
  storageKey = "remula-theme",
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      themes={["default", "sultan", "forest"]}
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
