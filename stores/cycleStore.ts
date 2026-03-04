import { create } from "zustand";

export type CycleType = "calendar" | "paycheck";

interface CycleState {
  cycleType: CycleType;
  paycheckDate: number;
  setCycle: (cycleType: CycleType, paycheckDate: number) => void;
}

/**
 * Financial cycle preferences. Synced from DB via SubscriptionSync.
 * Default: calendar, paycheckDate=1
 */
export const useCycleStore = create<CycleState>((set) => ({
  cycleType: "calendar",
  paycheckDate: 1,
  setCycle: (cycleType, paycheckDate) =>
    set({
      cycleType,
      paycheckDate: Math.max(1, Math.min(31, paycheckDate)),
    }),
}));
