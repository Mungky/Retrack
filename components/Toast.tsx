"use client";

import { useEffect } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${
          type === "success"
            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/20 border-red-500/30 text-red-400"
        }`}
        style={{
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        }}
      >
        {type === "success" ? (
          <CheckCircle2 size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
