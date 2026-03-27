"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="px-4 py-12 md:py-16 border-t border-border/50 mt-8"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          © {new Date().getFullYear()} ReTrack. Catat keuangan lebih mudah.
        </p>
        <nav className="flex items-center gap-6">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Syarat & Ketentuan
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Kebijakan Privasi
          </Link>
        </nav>
      </div>
    </motion.footer>
  );
}
