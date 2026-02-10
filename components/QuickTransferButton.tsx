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
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-cyan-600/20 border border-cyan-500/30 p-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 w-fit mb-3">
            <ArrowUpRight className="text-cyan-400" size={20} />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Quick Transfer</h3>
          <p className="text-xs text-slate-400">Send money instantly</p>
        </div>
      </div>

      <QuickTransferSheet isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
