import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { SheetProvider } from "@/contexts/SheetContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
  title: "Re-Start",
  description: "Premium Personal Finance Tracker",
  applicationName: "Re-Start",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Re-Start",
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#f0fdf4" },
  ],
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
        suppressHydrationWarning
      >
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('remula-theme');if(t&&['default','sultan','forest'].includes(t)){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','default')}}catch(e){document.documentElement.setAttribute('data-theme','default')}})();`,
          }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="default">
        <AuroraBackground />
        <AuthProvider>
          <SubscriptionSync />
          <ToastProvider>
            <SheetProvider>
              <AppShell>{children}</AppShell>
              <PremiumModal />
            </SheetProvider>
          </ToastProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
