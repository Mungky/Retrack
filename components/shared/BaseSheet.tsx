"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Z_INDEX } from "@/lib/z-index";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface BaseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Sheet title */
  title: string;
  /** Optional accent element before title (e.g. colored dot, icon) */
  titleAccent?: React.ReactNode;
  /** Sheet content */
  children: React.ReactNode;
  /** Use sheetNested for sheets opened from another sheet (e.g. form from manager) */
  nested?: boolean;
  /** Disable close button and backdrop click when loading */
  disabled?: boolean;
  /** Custom class for content wrapper */
  contentClassName?: string;
  /** Custom max height for scrollable content area (default: calc(90vh - 140px)) */
  contentMaxHeight?: string;
}

const sheetZ = (nested: boolean) =>
  nested ? Z_INDEX.sheetNested : Z_INDEX.sheet;
const backdropZ = (nested: boolean) =>
  nested ? Z_INDEX.sheetNested : Z_INDEX.backdrop;

export function BaseSheet({
  isOpen,
  onClose,
  title,
  titleAccent,
  children,
  nested = false,
  disabled = false,
  contentClassName,
  contentMaxHeight = "calc(90vh - 140px)",
}: BaseSheetProps) {
  const handleBackdropClick = () => {
    if (!disabled) onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 transition-opacity duration-300"
            style={{ zIndex: backdropZ(nested) }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 overflow-hidden"
            style={{
              zIndex: sheetZ(nested),
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
        <div className="sheet-panel mx-auto max-w-2xl rounded-t-3xl rounded-b-none overflow-hidden bg-card border-t border-x border-border shadow-2xl">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              {titleAccent}
              <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={disabled}
              aria-label="Close"
            >
              <X className="text-white/60" size={20} />
            </Button>
          </div>

          {/* Content - no default padding; children control their own spacing */}
          <div
            className={cn("overflow-y-auto", contentClassName)}
            style={{
              maxHeight: contentMaxHeight,
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            {children}
          </div>
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
