"use client";

import { motion } from "framer-motion";

export function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden bg-background"
      aria-hidden="true"
    >
      {/* Theme-aware orb (uses --primary) */}
      <motion.div
        className="absolute h-[400px] w-[400px] rounded-full blur-[120px] opacity-[0.15]"
        style={{ left: "10%", top: "20%", backgroundColor: "hsl(var(--primary) / 0.4)" }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -25, 15, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute h-[350px] w-[350px] rounded-full blur-[100px] opacity-[0.12]"
        style={{ right: "15%", top: "40%", backgroundColor: "hsl(var(--primary) / 0.35)" }}
        animate={{
          x: [0, -40, 25, 0],
          y: [0, 30, -20, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute h-[380px] w-[380px] rounded-full blur-[110px] opacity-[0.12]"
        style={{ left: "40%", bottom: "15%", backgroundColor: "hsl(var(--primary) / 0.3)" }}
        animate={{
          x: [0, 20, -35, 0],
          y: [0, -30, 25, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
