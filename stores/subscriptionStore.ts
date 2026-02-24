import { create } from "zustand";

interface SubscriptionState {
  isPro: boolean;
  setProStatus: (isPro: boolean) => void;
  upgrade: () => void;
  downgrade: () => void;
  checkLimit: (currentCount: number, limit: number) => boolean;
}

/**
 * Pro users bypass all limits.
 * Free users: true if currentCount < limit, false otherwise (show paywall).
 * Source of Truth: database (users.is_pro). Di-sync via SubscriptionSync.
 * TIDAK di-persist ke localStorage — murni state memory dari fetch DB.
 */
export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  isPro: false,
  setProStatus: (isPro: boolean) => set({ isPro }),
  upgrade: () => set({ isPro: true }),
  downgrade: () => set({ isPro: false }),
  checkLimit: (currentCount: number, limit: number) => {
    if (get().isPro) return true;
    return currentCount < limit;
  },
}));
