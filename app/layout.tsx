import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif-display",
});

const sans = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-body",
});

const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Arcadia — International Property Marketplace",
    template: "%s · Arcadia",
  },
  description:
    "Arcadia is a curated international marketplace for exceptional homes — villas, penthouses and estates across Lagos, London, Dubai, New York and Cape Town.",
  openGraph: {
    type: "website",
    siteName: "Arcadia",
    locale: "en_GB",
    url: siteUrl,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-charcoal-900 focus:px-4 focus:py-2 focus:text-ivory-50"
        >
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
