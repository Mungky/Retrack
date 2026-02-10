"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revalidateTransactionPaths } from "@/app/actions";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  onConfirm?: () => void;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  transactionId,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (onConfirm) {
      onConfirm();
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabaseClient
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) throw error;

      await revalidateTransactionPaths();
      showToast("Transaksi berhasil dihapus!", "success");
      onClose();
      setTimeout(() => router.refresh(), 500);
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      showToast(error?.message || "Gagal menghapus transaksi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertTriangle className="text-red-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Hapus Transaksi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="text-white/60" size={20} />
          </button>
        </div>

        <p className="text-white/60 mb-6">
          Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Menghapus...</span>
              </>
            ) : (
              "Hapus"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
