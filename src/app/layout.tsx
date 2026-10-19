import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RIFOI — For your needs Rifoi | Online Shopping in Bangladesh",
    template: "%s | RIFOI",
  },
  description:
    "RIFOI is your trusted online shop in Bangladesh. Fashion, electronics, watches, shoes & more with cash on delivery.",
  keywords: ["RIFOI", "online shopping Bangladesh", "fashion", "electronics", "cash on delivery", "bKash shopping"],
  openGraph: {
    type: "website",
    siteName: "RIFOI",
    title: "RIFOI — For your needs Rifoi",
    description: "Quality fashion, electronics, watches & essentials delivered across Bangladesh.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#faf7f2] text-neutral-900 antialiased">
        <StoreProvider>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <WhatsAppFloat />
        </StoreProvider>
      </body>
    </html>
  );
}
