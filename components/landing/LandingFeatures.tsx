"use client";

import { motion } from "framer-motion";
import {
  WifiOff,
  Ban,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { LIFETIME_PREMIUM_LABEL } from "@/lib/constants";

const features = [
  {
    icon: WifiOff,
    title: "Offline-First",
    description: "Catat transaksi kapan saja, bahkan tanpa internet. Data tersinkronisasi saat kembali online.",
  },
  {
    icon: Ban,
    title: "Tanpa Iklan",
    description: "Fokus mengelola keuangan tanpa gangguan. Pengalaman bersih dan nyaman.",
  },
  {
    icon: ShieldCheck,
    title: "100% Privasi Aman",
    description: "Data Anda tersimpan aman. Kami tidak menjual atau membagikan informasi pribadi.",
  },
  {
    icon: CreditCard,
    title: "Sekali Bayar",
    description: `${LIFETIME_PREMIUM_LABEL} sekali bayar, akses selamanya. Tidak ada langganan bulanan.`,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function LandingFeatures() {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="px-4 py-16 md:py-24"
    >
      <motion.h2
        variants={item}
        className="text-2xl md:text-3xl font-bold text-center text-foreground font-[var(--font-playfair)] mb-12"
      >
        Mengapa ReTrack?
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={item}
              className="p-6 rounded-xl fintech-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
