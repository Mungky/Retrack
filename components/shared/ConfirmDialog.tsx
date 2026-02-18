"use client";

import { X, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { Z_INDEX } from "@/lib/z-index";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Called when user confirms */
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  /** Visual style: danger (red) | warning (amber) */
  variant?: "danger" | "warning";
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  isLoading = false,
  variant = "danger",
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: Z_INDEX.sheet }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card
        variant="glass"
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-xl",
                isDanger ? "bg-red-500/20" : "bg-amber-500/20"
              )}
            >
              {isDanger ? (
                <AlertTriangle className="text-red-400" size={20} />
              ) : (
                <AlertCircle className="text-amber-400" size={20} />
              )}
            </div>
            <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close"
          >
            <X className="text-white/60" size={20} />
          </Button>
        </div>

        <p className="text-white/60 mb-6">{description}</p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              isDanger
                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Memproses...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}
