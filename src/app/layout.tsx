import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageTransition } from "@/components/page-transition";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clothy — Брендовые вещи",
  description:
    "Покупай и продавай оригинальную брендовую одежду, обувь и аксессуары в Беларуси.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-neutral-900">
        <Providers>
          <header className="sticky top-0 z-40 bg-white border-b border-neutral-100">
            <Link href="/" className="flex items-center gap-2 px-4 py-2.5">
              <Image src="/logo.png" alt="Clothy" width={28} height={28} className="rounded-md" priority />
              <span className="font-bold text-sm tracking-tight">Clothy.by</span>
            </Link>
          </header>
          <main className="flex-1 pb-20 bg-white">
            <Suspense>
              <PageTransition>{children}</PageTransition>
            </Suspense>
          </main>
          <Suspense>
            <BottomNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
