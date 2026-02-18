"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  formatCurrency as fmtCurrency,
  formatCurrencyCompact as fmtCompact,
  formatCurrencyFull as fmtFull,
  type CurrencyOption,
} from "@/lib/currency";

const STORAGE_KEY = "remula-currency";

interface CurrencyContextType {
  currency: CurrencyOption;
  setCurrency: (c: CurrencyOption) => void;
  formatCurrency: (amount: number) => string;
  formatCurrencyCompact: (amount: number) => string;
  formatCurrencyFull: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

function getStoredCurrency(): CurrencyOption {
  if (typeof window === "undefined") return "IDR";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "USD" || stored === "EUR" || stored === "IDR") return stored;
  return "IDR";
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyOption>("IDR");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrencyState(getStoredCurrency());
    setMounted(true);
  }, []);

  const setCurrency = useCallback((c: CurrencyOption) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const formatCurrency = useCallback(
    (amount: number) => fmtCurrency(amount, mounted ? currency : "IDR"),
    [currency, mounted]
  );
  const formatCurrencyCompact = useCallback(
    (amount: number) => fmtCompact(amount, mounted ? currency : "IDR"),
    [currency, mounted]
  );
  const formatCurrencyFull = useCallback(
    (amount: number) => fmtFull(amount, mounted ? currency : "IDR"),
    [currency, mounted]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        formatCurrencyCompact,
        formatCurrencyFull,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
