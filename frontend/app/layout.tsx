/**
 * ROOT LAYOUT
 *
 * This is the root layout for the entire application
 * It wraps all pages with providers and global styles
 *
 * WHAT'S HAPPENING HERE:
 * 1. Fonts are loaded (Inter for text, JetBrains Mono for code)
 * 2. Global CSS is imported
 * 3. Metadata is set (page title, description for SEO)
 * 4. LineraProvider wraps the app for wallet and blockchain access
 *
 * DUAL-MODE ARCHITECTURE:
 * - Public Mode: Read-only access to blockchain data (no wallet needed)
 * - Wallet Mode: Full access including mutations (after wallet connection)
 *
 * Users can explore the app without connecting, then connect when they
 * want to track events or send messages.
 */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LineraProvider } from "@/components/providers/LineraProvider";
import { SearchProvider } from "@/components/providers/SearchContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fluxera Dashboard - Linera Analytics",
  description: "Real-time analytics and indexing for Linera microchains. Track events, monitor chains, and visualize cross-chain activity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {/*
          LineraProvider enables dual-mode access:
          - Public hooks (useDashboard, useEvents, etc.) work without wallet
          - Authenticated hooks (useTrackEvent, useSendMessage) require wallet
          SearchProvider enables global search across components
        */}
        <SearchProvider>
          <LineraProvider>
            {children}
          </LineraProvider>
        </SearchProvider>
      </body>
    </html>
  );
}
