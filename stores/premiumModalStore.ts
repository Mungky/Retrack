import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

interface PremiumModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const usePremiumModalStore = create<PremiumModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

/** Global hook to open/close Premium paywall from any component */
export function usePremiumModal() {
  return usePremiumModalStore(useShallow((s) => ({ open: s.open, close: s.close })));
}
