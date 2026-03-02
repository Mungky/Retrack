"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="size-12 text-destructive" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-playfair text-foreground">
            Oops! Sesuatu berjalan tidak semestinya.
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Jangan khawatir, data Anda aman. Silakan coba muat ulang halaman.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Coba Lagi
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-xl font-semibold border border-border bg-transparent hover:bg-white/5 active:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
