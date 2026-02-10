import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { SheetProvider } from "@/contexts/SheetContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Remula Money",
  description: "Aplikasi tracking keuangan pribadi",
  applicationName: "Remula Money",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Remula Money",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/icon-192x192.png",
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased min-h-screen relative bg-background text-foreground`}
      >
        <AuthProvider>
          <ToastProvider>
            <SheetProvider>
              <div className="relative z-10">
                {children}
              </div>
              <BottomNav />
            </SheetProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
