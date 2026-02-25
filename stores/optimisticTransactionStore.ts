import { create } from "zustand";
import type { Transaction } from "@/types";

/** Optimistic transaction (minimal shape for dashboard display) */
export interface OptimisticTransaction
  extends Pick<
    Transaction,
    "amount" | "type" | "date" | "description" | "category_id" | "source_wallet_id" | "destination_wallet_id"
  > {
  id: string;
}

interface OptimisticState {
  /** Pending transactions (temp id prefix: opt-) */
  transactions: OptimisticTransaction[];
  /** Delta per wallet: walletId -> balance change (+ or -) */
  walletDeltas: Record<string, number>;
  addOptimistic: (
    tx: OptimisticTransaction,
    deltas: Record<string, number>
  ) => void;
  removeOptimistic: (tempId: string) => void;
}

export const useOptimisticTransactionStore = create<OptimisticState>((set, get) => ({
  transactions: [],
  walletDeltas: {},

  addOptimistic: (tx, deltas) => {
    set((state) => ({
      transactions: [...state.transactions, tx],
      walletDeltas: Object.entries(deltas).reduce(
        (acc, [id, delta]) => {
          acc[id] = (state.walletDeltas[id] ?? 0) + delta;
          return acc;
        },
        { ...state.walletDeltas }
      ),
    }));
  },

  removeOptimistic: (tempId) => {
    const state = get();
    const tx = state.transactions.find((t) => t.id === tempId);
    if (!tx) return;

    const deltasToRevert: Record<string, number> = {};
    if (tx.type === "income" && tx.source_wallet_id) {
      deltasToRevert[tx.source_wallet_id] = -tx.amount;
    } else if (tx.type === "expense" && tx.source_wallet_id) {
      deltasToRevert[tx.source_wallet_id] = tx.amount;
    } else if (tx.type === "transfer" && tx.source_wallet_id && tx.destination_wallet_id) {
      deltasToRevert[tx.source_wallet_id] = tx.amount;
      deltasToRevert[tx.destination_wallet_id] = -tx.amount;
    }

    set((s) => ({
      transactions: s.transactions.filter((t) => t.id !== tempId),
      walletDeltas: Object.entries(s.walletDeltas).reduce(
        (acc, [id, curr]) => {
          const revert = deltasToRevert[id] ?? 0;
          const next = curr + revert;
          if (next !== 0) acc[id] = next;
          return acc;
        },
        {} as Record<string, number>
      ),
    }));
  },
}));
