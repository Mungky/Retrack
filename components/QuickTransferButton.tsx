"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import QuickTransferSheet from "./QuickTransferSheet";
import { useSheet } from "@/contexts/SheetContext";

export default function QuickTransferButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { setIsSheetOpen } = useSheet();

  const handleOpen = () => {
    setIsOpen(true);
    setIsSheetOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsSheetOpen(false);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="group glass-card p-5 hover:border-white/20 transition-all duration-300 cursor-pointer"
      >
        <div className="relative z-10">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 w-fit mb-3">
            <ArrowUpRight className="text-cyan-400" size={20} />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Quick Transfer</h3>
          <p className="text-xs text-white/60">Send money instantly</p>
        </div>
      </div>

      <QuickTransferSheet isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
