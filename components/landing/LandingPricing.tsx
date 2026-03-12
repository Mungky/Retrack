"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { LIFETIME_PREMIUM_LABEL } from "@/lib/constants";

const freeFeatures = [
  { text: "1 Dompet", included: true },
  { text: "Transaksi dasar", included: true },
  { text: "Statistik sederhana", included: true },
  { text: "Tanpa batas transaksi", included: false },
  { text: "Budget & planning", included: false },
  { text: "Ekspor data", included: false },
  { text: "Tanpa iklan", included: false },
];

const proFeatures = [
  { text: "Dompet tak terbatas", included: true },
  { text: "Semua fitur transaksi", included: true },
  { text: "Statistik lengkap", included: true },
  { text: "Tanpa batas transaksi", included: true },
  { text: "Budget & planning", included: true },
  { text: "Ekspor data", included: true },
  { text: "Tanpa iklan selamanya", included: true },
];

export function LandingPricing() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="px-4 py-16 md:py-24"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground font-[var(--font-playfair)] mb-12">
        Pilih Plan yang Sesuai
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="p-6 md:p-8 rounded-2xl fintech-card border border-border/50"
        >
          <h3 className="text-xl font-semibold text-foreground">Free</h3>
          <p className="text-muted-foreground text-sm mt-1">Mulai tanpa biaya</p>
          <p className="mt-4 text-2xl font-bold text-foreground">Rp 0</p>
          <p className="text-sm text-muted-foreground">Untuk mencoba fitur dasar</p>
          <ul className="mt-6 space-y-3">
            {freeFeatures.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm">
                {f.included ? (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                )}
                <span className={f.included ? "text-foreground" : "text-muted-foreground line-through"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-8 block w-full py-3 rounded-xl font-semibold text-center border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            Mulai Gratis
          </Link>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="relative p-6 md:p-8 rounded-2xl fintech-card border-2 border-primary bg-primary/5"
        >
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
            Paling Populer
          </span>
          <h3 className="text-xl font-semibold text-foreground">Pro</h3>
          <p className="text-muted-foreground text-sm mt-1">Lifetime access</p>
          <p className="mt-4 text-2xl font-bold text-foreground">{LIFETIME_PREMIUM_LABEL}</p>
          <p className="text-sm text-muted-foreground">Sekali bayar, selamanya</p>
          <ul className="mt-6 space-y-3">
            {proFeatures.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground">{f.text}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/register?plan=pro"
            className="mt-8 block w-full py-3 rounded-xl font-semibold text-center text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            Upgrade ke Pro
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
