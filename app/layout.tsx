import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { SheetProvider } from "@/contexts/SheetContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/components/theme-provider";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { SubscriptionSync } from "@/components/SubscriptionSync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Money Tracker",
  description: "Premium Personal Finance Tracker",
  applicationName: "Money Tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MoneyTrack",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icon-192x192.png",
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased min-h-screen relative text-foreground overflow-x-hidden bg-background`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('remula-theme');if(t&&['default','sultan','forest'].includes(t)){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','default')}}catch(e){document.documentElement.setAttribute('data-theme','default')}})();`,
          }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="default">
        <AuroraBackground />
        <AuthProvider>
          <SubscriptionSync />
          <CurrencyProvider>
          <ToastProvider>
            <SheetProvider>
              <div className="relative z-10">
                {children}
              </div>
              <BottomNav />
              <PremiumModal />
            </SheetProvider>
          </ToastProvider>
          </CurrencyProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
