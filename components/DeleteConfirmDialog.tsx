"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { revalidateTransactionPaths } from "@/app/actions";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { supabaseClient } from "@/lib/supabase-client";
import { useToast } from "@/contexts/ToastContext";
import { useSheet } from "@/contexts/SheetContext";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

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
  const { setIsSheetOpen } = useSheet();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSheetOpen(true);
    } else {
      setIsSheetOpen(false);
    }
  }, [isOpen, setIsSheetOpen]);

  const handleDelete = async () => {
    if (onConfirm) {
      await onConfirm();
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
      showToast(TOAST_MESSAGES.SUCCESS.TRANSACTION_DELETED, "success");
      onClose();
      setTimeout(() => router.refresh(), 500);
    } catch (error: unknown) {
      console.error("Error deleting transaction:", error);
      showToast(
        (error as { message?: string })?.message ||
          TOAST_MESSAGES.ERROR.TRANSACTION_DELETE_FAILED,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Hapus Transaksi"
      description="Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan."
      onConfirm={handleDelete}
      isLoading={isLoading}
      variant="danger"
      confirmLabel="Hapus"
    />
  );
}
