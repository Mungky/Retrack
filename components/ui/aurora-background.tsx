"use client";

import { motion } from "framer-motion";

export function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden bg-[#09090b]"
      aria-hidden="true"
    >
      {/* Violet orb */}
      <motion.div
        className="absolute h-[400px] w-[400px] rounded-full bg-violet-500/30 blur-[120px] opacity-20"
        style={{ left: "10%", top: "20%" }}
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

      {/* Emerald orb */}
      <motion.div
        className="absolute h-[350px] w-[350px] rounded-full bg-emerald-500/25 blur-[100px] opacity-20"
        style={{ right: "15%", top: "40%" }}
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

      {/* Rose orb */}
      <motion.div
        className="absolute h-[380px] w-[380px] rounded-full bg-rose-500/25 blur-[110px] opacity-20"
        style={{ left: "40%", bottom: "15%" }}
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
