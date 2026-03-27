"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4 backdrop-blur-xl border-b border-border/30 bg-background/70"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold font-[var(--font-playfair)] text-foreground">
          ReTrack
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Mulai Gratis
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
