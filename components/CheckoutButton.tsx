"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export function CheckoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [snapReady, setSnapReady] = useState(false);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  useEffect(() => {
    if (typeof window !== "undefined" && (window as unknown as { snap?: unknown }).snap) {
      setSnapReady(true);
    }
  }, []);

  const handleCheckout = async () => {
    if (!clientKey) {
      alert("Midtrans client key tidak dikonfigurasi.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat transaksi");
      }

      const { token } = data;
      if (!token) {
        throw new Error("Token tidak diterima dari server");
      }

      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(token, {
          onSuccess: (result) => {
            console.log("Pembayaran berhasil:", result);
            alert("Pembayaran berhasil!");
          },
          onPending: (result) => {
            console.log("Pembayaran tertunda:", result);
            alert("Pembayaran tertunda. Silakan selesaikan pembayaran.");
          },
          onError: (result) => {
            console.error("Pembayaran gagal:", result);
            alert("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: () => {
            console.log("Pop-up pembayaran ditutup");
          },
        });
      } else {
        alert("Midtrans Snap belum siap. Tunggu sebentar dan coba lagi.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={clientKey}
        strategy="afterInteractive"
        onLoad={() => setSnapReady(true)}
      />
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading || !snapReady}
        className="px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Memproses..." : "Bayar Sekarang"}
      </button>
    </>
  );
}
