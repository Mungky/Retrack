"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import AddTransactionSheet from "./AddTransactionSheet";
import { useSheet } from "@/contexts/SheetContext";

export default function FloatingActionButton() {
  const { setIsSheetOpen } = useSheet();
  const [isOpen, setIsOpen] = useState(false);

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
      <button
        onClick={handleOpen}
        className="fixed bottom-28 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 border border-emerald-400/50 shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 group"
        style={{
          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(6, 182, 212, 0.5)',
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/50 to-cyan-400/50 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <Plus className="text-white" size={28} strokeWidth={2.5} />
        </div>
      </button>

      <AddTransactionSheet isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
