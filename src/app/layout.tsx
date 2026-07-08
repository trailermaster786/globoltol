import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Global Toll — Enterprise Toll Tax Management",
  description:
    "Production-grade, multi-tenant toll tax management platform for national highway authorities and large toll concessionaires. Real-time transaction processing, settlement, enforcement, and analytics.",
  keywords: [
    "Global Toll",
    "Toll Management",
    "ETC",
    "FASTag",
    "ANPR",
    "E-Challan",
    "Highway Operations",
    "Multi-tenant SaaS",
  ],
  authors: [{ name: "Global Toll" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Global Toll — Enterprise Toll Tax Management",
    description:
      "Multi-tenant SaaS platform for operating toll roads, bridges, tunnels, and highway networks.",
    siteName: "Global Toll",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${mono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
