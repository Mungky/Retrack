"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { useTheme } from "next-themes";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { usePremiumModal } from "@/stores/premiumModalStore";
import { ArrowDownLeft, ArrowUpRight, Delete, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { Z_INDEX } from "@/lib/z-index";

export interface CalculatorItem {
  id: string;
  value: number;
  label: string;
  name: string;
}

interface CalculatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (total: number, description: string, type: "income" | "expense") => void;
}

function formatForDescription(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}Jt`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

/** Display state stores raw JS number string (e.g. "0.15", "6000"). Never use locale formatting here. */
function parseDisplay(s: string): number {
  return parseFloat(s) || 0;
}

/** Convert number to raw string for display state (avoids float precision noise). */
function numberToRawString(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const cleaned = parseFloat(n.toFixed(15));
  return cleaned.toString();
}

/** Format raw display string for screen (integer part with id-ID thousands, decimal part preserved). */
function formatForScreen(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "0";
  const [intPart, decPart] = trimmed.split(".");
  const num = parseFloat(intPart || "0");
  const formattedInt = num.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  if (decPart !== undefined && decPart !== "") {
    return formattedInt + "," + decPart;
  }
  return formattedInt;
}

const NUMPAD_LAYOUT: string[][] = [
  ["C", "⌫", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["Add", "0", ".", "="],
];

export default function CalculatorDialog({ isOpen, onClose, onSave }: CalculatorDialogProps) {
  const [mounted, setMounted] = useState(false);
  const { theme: themeVal, resolvedTheme } = useTheme();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const { open: openPremium } = usePremiumModal();

  useEffect(() => setMounted(true), []);

  const theme = (mounted ? (themeVal || resolvedTheme || "default") : "default") as "default" | "sultan" | "forest";

  // Calculator state
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [calcHistory, setCalcHistory] = useState<{ expr: string; result?: string }[]>([]);

  // Receipt / Shopping
  const [items, setItems] = useState<CalculatorItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const total = items.reduce((sum, item) => sum + item.value, 0);

  const primaryBtnClass =
    theme === "sultan"
      ? "bg-amber-500/90 text-amber-950 hover:bg-amber-400"
      : theme === "forest"
        ? "bg-emerald-500/90 text-white hover:bg-emerald-400"
        : "bg-primary text-primary-foreground hover:bg-primary/90";

  const receiptBgClass =
    theme === "forest" ? "bg-white/95" : theme === "sultan" ? "bg-zinc-800/95" : "bg-card";

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const computeResult = useCallback((a: number, op: string, b: number): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? 0 : a / b;
      default:
        return b;
    }
  }, []);

  const handleCalcKey = useCallback(
    (key: string) => {
      if (key === "C") {
        setDisplay("0");
        setPreviousValue(null);
        setOperator(null);
        setWaitingForOperand(false);
        setCalcHistory([]);
        return;
      }
      if (key === "⌫") {
        setDisplay((prev) => {
          const next = prev.slice(0, -1);
          return next === "" || next === "-" ? "0" : next;
        });
        setWaitingForOperand(false);
        return;
      }
      if (key === "%") {
        const current = parseDisplay(display);
        const result = current / 100;
        setDisplay(numberToRawString(result));
        setWaitingForOperand(true);
        return;
      }
      if (["+", "-", "×", "÷"].includes(key)) {
        const current = parseDisplay(display);
        if (previousValue !== null && operator) {
          const result = computeResult(previousValue, operator, current);
          const resultStr = formatForScreen(numberToRawString(result));
          setCalcHistory((h) => {
            const next = [...h.slice(-19)];
            if (next.length > 0 && !next[next.length - 1].result) {
              next[next.length - 1] = { expr: `${formatForScreen(previousValue.toString())} ${operator} ${formatForScreen(display)} =`, result: resultStr };
            } else {
              next.push({ expr: `${formatForScreen(previousValue.toString())} ${operator} ${formatForScreen(display)} =`, result: resultStr });
            }
            next.push({ expr: `${resultStr} ${key}` }); // incomplete, menunggu operand
            return next;
          });
          setDisplay(numberToRawString(result));
          setPreviousValue(result);
        } else {
          setPreviousValue(current);
          setCalcHistory((h) => [...h.slice(-19), { expr: `${formatForScreen(display)} ${key}` }]); // incomplete
        }
        setOperator(key);
        setWaitingForOperand(true);
        return;
      }
      if (key === "=") {
        const current = parseDisplay(display);
        if (previousValue !== null && operator) {
          const result = computeResult(previousValue, operator, current);
          const resultStr = formatForScreen(numberToRawString(result));
          setCalcHistory((h) => {
            const next = [...h.slice(-19)];
            if (next.length > 0 && !next[next.length - 1].result) {
              next[next.length - 1] = { expr: `${formatForScreen(previousValue.toString())} ${operator} ${formatForScreen(display)} =`, result: resultStr };
            } else {
              next.push({ expr: `${formatForScreen(previousValue.toString())} ${operator} ${formatForScreen(display)} =`, result: resultStr });
            }
            return next;
          });
          setDisplay(numberToRawString(result));
          setPreviousValue(null);
          setOperator(null);
        }
        setWaitingForOperand(true);
        return;
      }
      if (key === ".") {
        if (waitingForOperand) {
          setDisplay("0.");
        } else if (!display.includes(".")) {
          setDisplay((prev) => prev + ".");
        }
        setWaitingForOperand(false);
        return;
      }
      if (key === "0" || /^[1-9]$/.test(key)) {
        if (waitingForOperand) {
          setDisplay(key);
        } else {
          setDisplay((prev) => {
            if (prev === "0" && key !== "0") return key;
            return prev + key;
          });
        }
        setWaitingForOperand(false);
      }
    },
    [display, previousValue, operator, waitingForOperand, computeResult]
  );

  const valueToAdd = parseDisplay(display);
  const handleAddToList = useCallback(() => {
    const value = Math.round(valueToAdd);
    if (value <= 0) return;
    const label = formatCurrency(value);
    const nextIndex = items.length + 1;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), value, label, name: `Item ${nextIndex}` }]);
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, [valueToAdd, items.length, formatCurrency]);

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditName("");
    }
  }, [editingId]);

  const handleStartRename = useCallback(
    (item: CalculatorItem) => {
      if (!isPro) {
        openPremium();
        return;
      }
      setEditingId(item.id);
      setEditName(item.name);
    },
    [isPro, openPremium]
  );

  const handleCommitRename = useCallback(() => {
    if (!editingId) return;
    const name = editName.trim() || "Item";
    setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, name } : i)));
    setEditingId(null);
    setEditName("");
  }, [editingId, editName]);

  const handleSave = useCallback((type: "income" | "expense") => {
    if (items.length === 0) return;
    const itemParts = items.map((i) => `${i.name} (${formatForDescription(i.value)})`);
    onSave(total, itemParts.join(", "), type);
  }, [items, total, onSave]);

  const canSave = items.length > 0;
  const isOperatorKey = (k: string) => ["+", "-", "×", "÷", "%", "="].includes(k);
  const isFunctionKey = (k: string) => ["C", "⌫"].includes(k);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 bg-black/40 z-[60]"
          style={{ zIndex: Z_INDEX.sheet }}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-[61] flex flex-col bg-background overflow-hidden min-h-0",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
          )}
          style={{ zIndex: Z_INDEX.sheet + 1 }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-1 text-foreground/80 hover:text-foreground font-medium"
            >
              Batal
            </button>
            <DialogPrimitive.Title asChild>
              <h2 className="text-lg font-semibold text-foreground mx-auto">Shopping Assistant</h2>
            </DialogPrimitive.Title>
            <div className="w-[42px]"></div>
          </div>

          {/* Receipt list - ukuran fix, scroll saat tidak muat */}
          <div
            className={cn(
              "mx-4 mt-3 rounded-lg border border-border overflow-y-auto scrollbar-hide shrink-0",
              receiptBgClass,
              "h-40 min-h-[80px] px-3 py-2"
            )}
          >
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-3 text-center">
                Hitung angka lalu tap Add untuk tambah ke list
              </p>
            ) : (
              <ul className="space-y-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0"
                  >
                    {editingId === item.id ? (
                      <Input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleCommitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommitRename();
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditName("");
                          }
                        }}
                        className="h-8 text-sm flex-1 min-w-0 font-mono rounded-md"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartRename(item)}
                        className={cn(
                          "text-left truncate flex-1 min-w-0 font-medium flex items-center gap-1.5",
                          !isPro && "opacity-90"
                        )}
                      >
                        {!isPro && <Lock size={12} className="text-amber-500 shrink-0" />}
                        {item.name}
                      </button>
                    )}
                    <span className="font-mono text-sm tabular-nums shrink-0">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Hapus"
                    >
                      <Delete size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Calculator - FIXED di paling bawah, tidak bergerak */}
          <div className="shrink-0 mt-auto px-4 py-2 flex flex-col bg-background">
            {calcHistory.length > 0 && (
              <div className="overflow-y-auto max-h-24 min-h-0 mb-1 scrollbar-hide flex flex-col-reverse">
                {[...calcHistory].slice(-5).reverse().map((entry, i) => (
                  <div key={i} className="text-right font-mono tabular-nums">
                    <div className="text-sm text-foreground/80">{entry.expr}</div>
                    {entry.result != null && (
                      <div className="text-base font-semibold text-foreground mt-0.5">{entry.result}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-4xl sm:text-5xl font-semibold tabular-nums text-foreground text-right truncate font-mono">
              {formatForScreen(display)}
            </p>
          </div>

          {/* Numpad - bagian dari blok kalkulator tetap */}
          <div
            className="shrink-0 px-4 pb-4 pt-2"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
              {NUMPAD_LAYOUT.flat().map((key) => {
                const isNum = /^[0-9.]$/.test(key);
                const isAdd = key === "Add";
                const isOp = isOperatorKey(key);
                const isFn = isFunctionKey(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (isAdd) {
                        if (!isPro) {
                          openPremium();
                          return;
                        }
                        handleAddToList();
                      } else {
                        handleCalcKey(key);
                      }
                    }}
                    disabled={isAdd && valueToAdd <= 0}
                    className={cn(
                      "h-14 rounded-lg font-semibold text-lg transition-all active:scale-95 select-none flex items-center justify-center gap-1",
                      isNum && "bg-card text-foreground border border-border hover:bg-muted/50",
                      isAdd && primaryBtnClass,
                      isAdd && valueToAdd <= 0 && "opacity-50 cursor-not-allowed",
                      isOp && "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30",
                      isFn && "bg-secondary text-muted-foreground hover:bg-muted border border-border"
                    )}
                  >
                    {isAdd && !isPro && <Lock size={16} className="shrink-0" />}
                    {isAdd ? "Add" : key}
                  </button>
                );
              })}
            </div>

            {/* Add to Income / Add to Expense */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    openPremium();
                    return;
                  }
                  handleSave("income");
                }}
                disabled={!canSave}
                className={cn(
                  "py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                  "bg-emerald-500/90 text-white hover:bg-emerald-400"
                )}
              >
                {!isPro && <Lock size={16} className="shrink-0" />}
                <ArrowUpRight size={18} />
                Add to Income
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    openPremium();
                    return;
                  }
                  handleSave("expense");
                }}
                disabled={!canSave}
                className={cn(
                  "py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                  "bg-rose-500/90 text-white hover:bg-rose-400"
                )}
              >
                {!isPro && <Lock size={16} className="shrink-0" />}
                <ArrowDownLeft size={18} />
                Add to Expense
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
