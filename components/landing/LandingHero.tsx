"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative flex flex-col items-center justify-center text-center px-4 pt-16 pb-20 md:pt-24 md:pb-28"
    >
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-[var(--font-playfair)] tracking-tight max-w-4xl leading-tight">
        Catat Keuangan Tanpa Ribet.{" "}
        <span className="text-primary">Bebas Iklan.</span>
      </h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl"
      >
        Sekali Bayar <span className="font-semibold text-foreground">Rp 50.000</span>,
        Akses Selamanya.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link
          href="/register"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          Mulai Gratis
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
        >
          Masuk
        </Link>
      </motion.div>
    </motion.section>
  );
}
